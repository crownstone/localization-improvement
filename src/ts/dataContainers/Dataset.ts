import path from "path";
import {PLOT_DEFAULT_HEIGHT, PLOT_DEFAULT_WIDTH, PLOT_MARGINS, TMP_DATASET_PATH} from "../config";
import {FileUtil} from "../util/FileUtil";
import {DataMapper} from "../util/DataMappers";
import {Layout, plot, Plot, stack} from "nodeplotlib";

export class Dataset {

  name : string = null;
  path : string = null;
  _data : AppDatasetFormat;

  constructor(datasetPath: string | null = null) {
    if (datasetPath) {
      this.name = path.basename(datasetPath);
      this.path = datasetPath;
    }
  }

  getAppData() : AppDatasetFormat {
    if (this._data) { return this._data; }
    this._data = FileUtil.readJSON<AppDatasetFormat>(this.path);
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

  plotOffsetGraph(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = this.getAppData();

    let results = []
    let labels = [];
    for (let i = 0; i < data.dataset.length; i++) {
      results.push(new Array(data.dataset.length))
      labels.push(i)
    }

    let result = []

    for (let i = 1; i < data.dataset.length; i++) {
      let [squaredDistance, similarItems] = getDistance(data.dataset[i-1], data.dataset[i]);
      result.push(squaredDistance)
    }

    let layout : Layout = {
      title: "Squared distance between sequantial samples (movement estimate)",
      width: width,
      height: height,
      xaxis:{title:"samples"},
      yaxis:{title:"squared distance"},
      ...PLOT_MARGINS,
    }

    stack([{y:result}], layout);
  }

  plotDistanceReport(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = this.getAppData();

    let results = []
    let labels = [];
    for (let i = 0; i < data.dataset.length; i++) {
      results.push(new Array(data.dataset.length))
      labels.push(i)
    }

    for (let i = 0; i < data.dataset.length - 1; i++) {
      for (let j = i+1; j < data.dataset.length; j++) {
        let [squaredDistance, similarItems] = getDistance(data.dataset[i], data.dataset[j]);
        results[i][j] = squaredDistance;
        // results[j][i] = squaredDistance;
      }
    }

    let plotData : Plot = {
      x: labels,
      y: labels,
      z: results,
      type: 'heatmap',
    };

    let layout : Layout = {
      title: "Squared distance between sample points",
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