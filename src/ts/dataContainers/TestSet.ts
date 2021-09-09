import {Fingerprint} from "./Fingerprint";
import {Dataset} from "./Dataset";
import {Runner} from "../runners/Runner";
import {FileUtil} from "../util/FileUtil";
import {OutputData} from "./OutputData";
import {OutputDataAggregator} from "./OutputDataAggregator";
import {SIMULATION_CONFIG, WEKA_DATASET_PATH, WEKA_FINGERPRINT_PATH} from "../config";
import {Util} from "../util/Util";
import {DataMapper} from "../util/DataMappers";
import {NaiveBayesian} from "../runners/node/NaiveBayesian";
import {NaiveBayesianGaussianMixture} from "../runners/node/NaiveBayesianGaussianMixture";
var sha1 = require('sha1');


export class TestSet {

  userName      : string;
  scenarioName  : string;

  fingerprint   : Fingerprint;
  datasets      : Dataset[] = [];

  results          : {[datasetName: string] : OutputData } = {};
  aggregatedResult : OutputDataAggregator = null;

  constructor(scenarioPath?: string, fingerprintPath?: string, scenarioName: string = "UnknownScenario", userName: string = "UnknownUser") {
    this.userName = userName;
    this.scenarioName = scenarioName;

    if (fingerprintPath) {
      this.loadFingerprint(fingerprintPath)
    }
    if (scenarioPath) {
      let datasetFiles = FileUtil.getJSONFilePaths(scenarioPath);
      this.loadDatasets(datasetFiles);
    }

  }

  /**
   * Load your datasets into this testset
   * Either load an array filled with paths to dataset files, dataset classes or a mix of the 2
   * Or you can load a single dataset class or path to one.
   * @param datasets
   */
  loadDatasets(datasets : string[] | Dataset[] | Dataset | string) {
    let useSets;
    if (Array.isArray(datasets) === false) {
      useSets = [datasets];
    }
    else {
      useSets = datasets;
    }

    if (useSets.length == 0) { return }
    for (let datasetInfo of useSets) {
      if (typeof datasetInfo === "string") {
        this.datasets.push(new Dataset(datasetInfo));
      }
      else {
        this.datasets.push(datasetInfo);
      }
    }
  }

  loadFingerprint(fingerprintPath: string | Fingerprint) {
    if (typeof fingerprintPath === "string") {
      this.fingerprint = new Fingerprint(fingerprintPath);
    }
    else {
      this.fingerprint = fingerprintPath;
    }
  }

  _getLocationNameMap() : LocationNameMap {
    return this.fingerprint.getLocationNameMap()
  }

  _getDatasetByName(datasetName) : Dataset {
    for (let dataset of this.datasets) {
      if (dataset.name === datasetName) {
        return dataset;
      }
    }
    throw new Error("Could not find dataset");
  }

  async run(datasetName: string | Dataset, overwrite = false) : Promise<OutputData> {
    this._ensureAggregator()

    let dataset;
    if (typeof datasetName === 'string') {
      dataset = this._getDatasetByName(datasetName);
    }
    else {
      dataset = datasetName;
    }

    let runner = new Runner(this.fingerprint, dataset, this._getOutputAnnotation());
    let paths = await runner.start(overwrite);

    this.results[dataset.name] = new OutputData(paths[0], dataset, this.fingerprint, this._getLocationNameMap());
    return this.results[dataset.name];
  }

  _getOutputAnnotation() : string {
    let settingsHash = sha1(JSON.stringify(SIMULATION_CONFIG));
    let annotation = `${this.userName}_${this.scenarioName}_${this.fingerprint.name.replace(".json",'')}_${settingsHash}`
    return annotation;
  }


  async runAll(overwrite = false) : Promise<OutputData[]> {
    this._ensureAggregator()

    let runner = new Runner(this.fingerprint, this.datasets, this._getOutputAnnotation());
    let outputPaths = await runner.start(overwrite);

    // collecting output files...
    for (let i = 0; i < outputPaths.length; i++) {
      this.results[this.datasets[i].name] = new OutputData(outputPaths[i], this.datasets[i], this.fingerprint, this._getLocationNameMap());
    }

    this.clearAggregatedResults()
    this.aggregate();

    return Object.values(this.results);
  }

  async runAllNode() : Promise<OutputData[]> {
    this._ensureAggregator()

    let classifier = new NaiveBayesian();
    classifier.train(this.fingerprint.getAppData());

    for (let dataset of this.datasets) {
      let data = dataset.getAppData();
      let outputData : LibOutputDataset = {naiveBayesian: [], kNN: []}
      for (let datapoint of data.dataset) {
        let classification = classifier.classify(datapoint, dataset.sphereId);
        outputData.naiveBayesian.push({
          sphereId:       dataset.sphereId,
          result:         classification,
          expectedLabel:  dataset.locationId,
          probabilities:  {}
        });
      }
      this.results[dataset.name] = new OutputData(null, dataset, this.fingerprint, this._getLocationNameMap());
      this.results[dataset.name].setData(outputData);
    }
    this.clearAggregatedResults()
    this.aggregate();

    return Object.values(this.results);
  }


  _ensureAggregator() {
    if (this.aggregatedResult === null) {
      this.aggregatedResult = new OutputDataAggregator(this._getLocationNameMap());
    }
  }

  clearAggregatedResults() {
    this.aggregatedResult.clear();
  }

  aggregate() {
    for (let datasetName in this.results) {
      this.aggregatedResult.add(this.results[datasetName])
    }
  }

  generateWekaFiles() {
    if (this.datasets.length === 0) {
      throw "No datasets to work with."
    }

    let sphereIds = {}
    for (let dataset of this.datasets) {
      dataset.getAppData();
      sphereIds[dataset.sphereId] = true;
    }

    for (let sphereId in sphereIds) {
      let locationNameMap = this.fingerprint.getLocationNameMap();
      let locationNames = DataMapper.getLocationLabels(sphereId, locationNameMap);

      // generate a Crownstone map that covers all obeserved Crownstones in the testset.
      let crownstoneMap = this.fingerprint.getCrownstoneMap(sphereId);
      for (let dataset of this.datasets) {
        Util.deepExtend(crownstoneMap, dataset.getCrownstoneMap())
      }

      DataMapper.FingerprintToWeka(sphereId, this.fingerprint, crownstoneMap, locationNames)
        .store(WEKA_FINGERPRINT_PATH + `${sphereId}_${this.fingerprint.name}.arff`);

      let arff = null;
      for (let dataset of this.datasets) {
        let newArff = DataMapper.DatasetToWeka(dataset, this.fingerprint, crownstoneMap, locationNames);
        if (arff === null) {
          arff = newArff
        }
        else {
          arff.join(newArff);
        }
      }

      arff.store(WEKA_DATASET_PATH + `${sphereId}_${this.scenarioName}.arff`);
    }
  }

}