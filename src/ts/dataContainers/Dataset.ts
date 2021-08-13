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

  plotSummary(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    this.plotDistanceReport(  width, height);
    this.plotSampleSizeGraph( width, 0.5*height);
    this.plotOffsetGraph(     width, 0.5*height);
    plot();
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

  plotDistanceReport(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = this.getAppData();

    let results = []
    let labels = [];

    let maxPoints = 400;
    let sampleCount = data.dataset.length

    let stepSize = Math.max(1,Math.ceil(sampleCount/maxPoints))
    let inv = 1/stepSize;

    for (let i = 0; i < sampleCount; i += stepSize) {
      results.push(new Array(Math.floor(data.dataset.length*inv)))
      labels.push(i)
    }

    for (let i = 0; i < sampleCount - stepSize; i += stepSize) {
      for (let j = i+stepSize; j < sampleCount; j += stepSize) {
        let [squaredDistance, similarItems] = getDistance(data.dataset[i], data.dataset[j]);
        results[i*inv][j*inv] = squaredDistance;
        results[j*inv][i*inv] = squaredDistance;
      }
    }

    let plotData : Plot = {
      x: labels,
      y: labels,
      z: results,
      type: 'heatmap',
    };

    let layout : Layout = {
      title: `Squared distance between sample points (D=${stepSize})`,
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