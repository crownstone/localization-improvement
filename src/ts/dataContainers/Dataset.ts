import path from "path";
import {PLOT_DEFAULT_HEIGHT, PLOT_DEFAULT_WIDTH, PLOT_MARGINS, SIMULATION_CONFIG, TMP_DATASET_PATH} from "../config";
import {FileUtil} from "../util/FileUtil";
import {DataMapper} from "../util/DataMappers";
import {Layout, plot, Plot, stack} from "nodeplotlib";
import {DataTransform} from "../util/DataTransform";
import {getDistance} from "../util/Util";

export class Dataset {

  name         : string = null;
  path         : string = null;

  sphereId     : string = null;
  sphereName   : string = null;
  locationName : string = null;
  locationId  : string = null;

  _data        : AppDatasetFormat;

  constructor(datasetPath: string | null = null) {
    if (datasetPath) {
      this.name = path.basename(datasetPath);
      this.path = datasetPath;
    }
  }

  /**
   * Syntax sugar. getAppdata sets all the fields in this class so it is sort of an initialize call.
   */
  initialize() {
    this.getAppData();
  }

  setData(data: AppDatasetFormat) {
    this._data = data;
    this.locationName = this._data?.location?.name  || "UNKNOWN"
    this.locationId   = this._data?.location?.uid   || "UNKNOWN"
    this.sphereName   = this._data?.sphere?.name    || "UNKNOWN"
    this.sphereId     = this._data?.sphere?.cloudId || "UNKNOWN"
    applySimulationConfig(this._data)
  }

  getCrownstoneMap() : CrownstoneMap {
    this.getAppData();
    let allCrownstones = {}
    for (let datapoint of this._data.dataset) {
      for (let deviceId in datapoint.devices) {
        allCrownstones[deviceId] = true;
      }
    }
    return allCrownstones;
  }

  getAppData() : AppDatasetFormat {
    if (this._data) { return this._data; }
    this.setData(FileUtil.readJSON<AppDatasetFormat>(this.path));
    return this._data;
  }

  getLibData() : DatasetFileLibFormat {
    let libData = DataMapper.AppDatasetToLibs(this.getAppData());
    return libData
  }

  writeToTempFile(tmpFilePath = TMP_DATASET_PATH) {
    FileUtil.store(tmpFilePath, this.getLibData());
  }

  getOutputPath(platform: Platform, annotation?: string) : string {
    return FileUtil.getOutputPath(this.path, platform, annotation);
  }

  plotSummary(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT, doPlot= true) {
    this.plotDistanceReport(  width, height*1.75);
    this.plotRssiOverview( width, height*1.75);
    this.plotSampleSizeGraph( width, height);
    this.plotOffsetGraph(     width, height);

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
      title: "Squared distance between sequential samples (movement estimate) (D=5)",
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

  plotDistanceReport(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT*2, title = undefined) {
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

  plotRssiOverview(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT*2, title = undefined, limit: number = -100) {
    let data = this.getAppData();

    let results = []
    let labelsY = [];

    let deviceIds = {};
    for (let i = 0; i < data.dataset.length; i++) {
      let item = data.dataset[i];
      labelsY.push(i)
      for (let deviceId in item.devices) {
        deviceIds[deviceId] = true;
      }
    }

    let deviceIdArray = Object.keys(deviceIds);

    let labelsX = deviceIdArray.map((a) => a.split("_Maj:")[1]);

    for (let i = 0; i < data.dataset.length; i++) {
      results.push(new Array(deviceIdArray.length))
    }

    for (let i = 0; i < data.dataset.length; i++) {
      for (let j = 0; j < deviceIdArray.length; j++) {
        let value = data.dataset[i].devices[deviceIdArray[j]];
        if (value <= limit) { value = -100 }
        results[i][j] = value;
      }
    }

    let plotData : Plot = {
      x: labelsX,
      y: labelsY,
      z: results,
      type: 'heatmap',
      colorscale: [
        [0.0, "#c800ff"],
        [0.000001, "#00172c"],
        [0.49, "#b1eb76"],
        [1.0, "#ff0000"]
      ]
    };

    let layout : Layout = {
      title: title || `Rssi distribution per sample`,
      width: width,
      height: height,
      xaxis:{title:"Crownstones"},
      yaxis:{title:"samples"},
      margin: {l: 150, r: 200, t: 100, b: 150},
    }

    stack([plotData], layout);
  }

  plotRssiBarGraph(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT*2, title = undefined, limit: number = -100) {
    let data = this.getAppData();

    let labelsY = [];

    let deviceIds = {};
    for (let i = 0; i < data.dataset.length; i++) {
      let item = data.dataset[i];
      labelsY.push(i)
      for (let deviceId in item.devices) {
        deviceIds[deviceId] = {};
      }
    }

    let deviceIdArray = Object.keys(deviceIds);

    for (let i = 0; i < data.dataset.length; i++) {
      for (let j = 0; j < deviceIdArray.length; j++) {
        let value = data.dataset[i].devices[deviceIdArray[j]];
        if (value <= limit) { value = -100 }
        if (!value) { continue; }
        if (deviceIds[deviceIdArray[j]][value] === undefined) {
          deviceIds[deviceIdArray[j]][value] = 0
        }
        deviceIds[deviceIdArray[j]][value] += 1
      }
    }


    let plots : Plot[] = [];
    for (let deviceId in deviceIds) {
      let x = []
      let y = []
      for (let rssi in deviceIds[deviceId]) {
        x.push(rssi);
        y.push(deviceIds[deviceId][rssi])
      }
      let plotData : Plot = {
        x,y,
        name: deviceId,
        type:"bar"

      };
      plots.push(plotData);
    }



    let layout : Layout = {
      title: title || `Rssi distribution bar graph`,
      width: width,
      height: height,
      xaxis:{title:"Crownstones"},
      yaxis:{title:"samples"},
      margin: {l: 150, r: 200, t: 100, b: 150},
    }

    stack(plots, layout);
  }
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


function applySimulationConfig(dataset: AppDatasetFormat) {
  applyInterpolation(dataset);
  applyRssiThreshold(dataset);
  applyDistanceConversion(dataset);
}

function applyRssiThreshold(dataset: AppDatasetFormat) {
  if (SIMULATION_CONFIG.datasets.rssiUpperThreshold !== -100) {
    DataTransform.applyRssiUpperThreshold(dataset.dataset, SIMULATION_CONFIG.datasets.rssiUpperThreshold);
  }

  if (SIMULATION_CONFIG.datasets.rssiLowerThreshold !== 0) {
    DataTransform.applyRssiLowerThreshold(dataset.dataset, SIMULATION_CONFIG.datasets.rssiLowerThreshold);
  }
}


function applyDistanceConversion(dataset: AppDatasetFormat) {
  if (SIMULATION_CONFIG.conversion.rssiToDistance === false) {
    return;
  }

  DataTransform.applyDistanceConversion(dataset.dataset)
}


function applyInterpolation(dataset: AppDatasetFormat) {
  if (SIMULATION_CONFIG.interpolation.datasets === false) {
    return;
  }

  DataTransform.applyInterpolation(dataset.dataset, false);
}
