import path from "path";
import {PLOT_DEFAULT_HEIGHT, PLOT_DEFAULT_WIDTH, PLOT_MARGINS, TMP_DATASET_PATH} from "../config";
import {FileUtil} from "../util/FileUtil";
import {DataMapper} from "../util/DataMappers";
import {Layout, plot, Plot, stack} from "nodeplotlib";

export class Dataset {

  name         : string = null;
  path         : string = null;

  sphereId     : string = null;
  sphereName   : string = null;
  locationName : string = null;
  locationUid  : string = null;

  _data        : AppDatasetFormat;

  constructor(datasetPath: string | null = null) {
    if (datasetPath) {
      this.name = path.basename(datasetPath);
      this.path = datasetPath;
    }
  }

  setData(data: AppDatasetFormat) {
    this._data = data;
    this.locationName = this._data?.location?.name  || "UNKNOWN"
    this.locationUid   = this._data?.location?.uid   || "UNKNOWN"
    this.sphereName   = this._data?.sphere?.name    || "UNKNOWN"
    this.sphereId     = this._data?.sphere?.cloudId || "UNKNOWN"
  }

  getAppData() : AppDatasetFormat {
    if (this._data) { return this._data; }
    this.setData(FileUtil.readJSON<AppDatasetFormat>(this.path));
    return this._data;
  }

  getLibData() : DatasetFileLibFormat {
    return DataMapper.AppDatasetToLibs(this.getAppData());
  }

  writeToTempFile(tmpFilePath = TMP_DATASET_PATH) {
    FileUtil.store(tmpFilePath, this.getLibData());
  }

  getOutputPath(platform: Platform, annotation?: string) : string {
    return FileUtil.getOutputPath(this.path, platform, annotation);
  }

  getRandomSample() : FingerprintDatapoint {
    let data = this.getAppData();
    let samples = data.dataset;
    let index = Math.floor(Math.random()*samples.length);
    return samples[index];
  }

  plotSummary(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT, doPlot= true) {
    this.plotDistanceReport(  width, height);
    this.plotSampleSizeGraph( width, 0.5*height);
    this.plotOffsetGraph(     width, 0.5*height);

    if (doPlot) {
      plot();
    }
  }

  plotOffsetGraph(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = this.getAppData();

    let plotData = []
    let result = []
    let distance = Math.min(5, Math.ceil(data.dataset.length/2));
    for (let j = distance; j < data.dataset.length; j++) {
      let [squaredDistance, similarItems] = getDistance(data.dataset[j - distance], data.dataset[j]);
      result.push(squaredDistance)
    }
    plotData.push({y:result, name:`D=${distance}`})

    let layout : Layout = {
      title: "Squared distance between sequantial samples (movement estimate) (D=5)",
      width: width,
      height: height,
      xaxis:{title:"samples"},
      yaxis:{title:"squared distance"},
      ...PLOT_MARGINS,
    }

    stack(plotData, layout);
  }

  plotSampleSizeGraph(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = this.getAppData();

    let result = []
    for (let point of data.dataset) {
      result.push(Object.keys(point.devices).length)
    }

    let layout : Layout = {
      title: "Amount of devices per sample",
      width: width,
      height: height,
      xaxis:{title:"samples"},
      yaxis:{title:"devicecount"},
      ...PLOT_MARGINS,
    }

    stack([{y:result}], layout);
  }

  plotDistanceReport(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT, title = undefined) {
    let data = this.getAppData();

    let [plotData, stepSize] = compareByDistance(data.dataset, data.dataset);

    let layout : Layout = {
      title: title || `Squared distance between sample points (D=${stepSize})`,
      width: width,
      height: height,
      xaxis:{title:"samples"},
      yaxis:{title:"samples"},
      ...PLOT_MARGINS,
    }

    stack([plotData], layout);
  }



}

function getDistance(a : FingerprintDatapoint, b: FingerprintDatapoint) {
  let squaredDistance = 0;
  let similarItems = 0;
  for (let deviceId in a.devices) {
    if (b.devices[deviceId]) {
      similarItems++;
      squaredDistance += Math.pow(a.devices[deviceId] - b.devices[deviceId], 2);
    }
  }
  return [squaredDistance, similarItems];
}


export function compareByDistance(set1 : FingerprintDatapoint[], set2: FingerprintDatapoint[], useSimilarItems = false) : [Plot, number] {
  let results = []
  let labelsX = [];
  let labelsY = [];

  let maxPoints = 400*400;
  let sampleCount = set1.length * set2.length

  let stepSize = Math.max(1,Math.ceil(sampleCount/maxPoints))
  let inv = 1/stepSize;

  for (let i = 0; i < set1.length; i += stepSize) {
    results.push(new Array(Math.floor(set2.length*inv)))
    labelsY.push(i)
  }
  for (let i = 0; i < set2.length; i += stepSize) {
    labelsX.push(i)
  }

  for (let i = 0; i < set1.length; i += stepSize) {
    for (let j = 0; j < set2.length; j += stepSize) {
      let [squaredDistance, similarItems] = getDistance(set1[i], set2[j]);
      if (useSimilarItems) {
        results[i*inv][j*inv] = similarItems;
      }
      else {
        results[i*inv][j*inv] = squaredDistance;
      }
    }
  }

  let plotData : Plot = {
    x: labelsX,
    y: labelsY,
    z: results,
    type: 'heatmap',
    colorscale: [
      [0.0, "#fff"],
      [0.000001, "#00172c"],
      [0.49, "#b1eb76"],
      [1.0, "#ff0000"]
    ]
  };


  return [plotData, stepSize]
}