import path from "path";
import {TMP_DATASET_PATH} from "../config";
import {FileUtil} from "../util/FileUtil";
import {DataMapper} from "../util/DataMappers";
import {Layout, plot, Plot, stack} from "nodeplotlib";

export class Dataset {

  name : string = null;
  path : string = null;
  data : AppDatasetFormat;

  constructor(datasetPath: string | null = null) {
    if (datasetPath) {
      this.name = path.basename(datasetPath);
      this.path = datasetPath;
    }
  }

  getAppData() : AppDatasetFormat {
    if (this.data) { return this.data; }
    this.data = FileUtil.readJSON<AppDatasetFormat>(this.path);
    return this.data;
  }

  getLibData() : DatasetFileLibFormat {
    return DataMapper.AppDatasetToLibs(this.getAppData());
  }

  writeToTempFile(tmpFilePath = TMP_DATASET_PATH) {
    FileUtil.store(tmpFilePath, this.getLibData());
  }

  getOutputPath(annotation?: string) : string {
    return FileUtil.getOutputPath(this.path, annotation);
  }

  getRandomSample() : FingerprintDatapoint {
    let data = this.getAppData();
    let samples = data.dataset;
    let index = Math.floor(Math.random()*samples.length);
    return samples[index];
  }

  getDistanceReport(stackPlot=false) {
    let data = this.getAppData();

    function getDistance(a : FingerprintDatapoint, b: FingerprintDatapoint) {
      let squaredDistance = 0;
      let similarItems = 0;
      for (let deviceId in a.devices) {
        if (b.devices[deviceId]) {
          similarItems++;
          squaredDistance += Math.pow(a.devices[deviceId] - b.devices[deviceId], 2);
        }
      }
      return [Math.sqrt(squaredDistance), similarItems];
    }

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

    let plotData : Plot[] = [{
      x: labels,
      y: labels,
      z: results,
      type: 'heatmap',
    }];
    let layout : Layout = {
      title: this.name,
      autosize:false,
      height: 800,
      width: 800,

    }

    if (stackPlot) {
      stack(plotData, layout)
    }
    else {
      plot(plotData, layout);
    }
  }


}