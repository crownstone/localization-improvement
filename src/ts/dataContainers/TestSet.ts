import {Fingerprint, FingerprintBase} from "./Fingerprint";
import {Dataset} from "./Dataset";
import {Runner} from "../runners/Runner";
import {FileUtil} from "../util/FileUtil";
import {OutputData} from "./OutputData";
import {OutputDataAggregator} from "./OutputDataAggregator";

export class TestSet {

  name: string;
  fingerprint  : FingerprintBase;
  datasets     : Dataset[] = [];

  results          : {[datasetName: string] : OutputData } = {};
  aggregatedResult : OutputDataAggregator;

  constructor(scenarioPath?: string, fingerprintPath?: string) {
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

  loadFingerprint(fingerprintPath: string | FingerprintBase) {
    if (typeof fingerprintPath === "string") {
      this.fingerprint = new Fingerprint(fingerprintPath);
    }
    else {
      this.fingerprint = fingerprintPath;
    }

    this.name = this.fingerprint.name;
    this.aggregatedResult = new OutputDataAggregator(this._getLocationNameMap());
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

  async run(datasetName: string | Dataset) : Promise<OutputData> {
    let dataset;
    if (typeof datasetName === 'string') {
      dataset = this._getDatasetByName(datasetName);
    }
    else {
      dataset = datasetName;
    }

    let runner = new Runner(this.fingerprint, dataset);
    let paths = await runner.start();

    this.results[dataset.name] = new OutputData(paths[0], dataset, this.fingerprint, this._getLocationNameMap());
    return this.results[dataset.name];
  }

  async runAll() : Promise<OutputData[]> {
    let runner = new Runner(this.fingerprint, this.datasets, this.fingerprint.name.replace(".json",''));
    let outputPaths = await runner.start();

    // collecting output files...
    for (let i = 0; i < outputPaths.length; i++) {
      this.results[this.datasets[i].name] = new OutputData(outputPaths[i], this.datasets[i], this.fingerprint, this._getLocationNameMap());
    }

    this.clearAggregatedResults()
    this.aggregate();

    return Object.values(this.results);
  }


  clearAggregatedResults() {
    this.aggregatedResult.clear();
  }

  aggregate() {
    for (let datasetName in this.results) {
      this.aggregatedResult.add(this.results[datasetName])
    }
  }

}