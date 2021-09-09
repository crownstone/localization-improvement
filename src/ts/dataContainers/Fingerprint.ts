import path from "path";
import {compareByDistance, Dataset} from "./Dataset";
import {
  PLOT_DEFAULT_HEIGHT,
  PLOT_DEFAULT_WIDTH,
  PLOT_MARGINS,
  SIMULATION_CONFIG, TMP_FINGERPRINT_PATH
} from "../config";
import {FileUtil} from "../util/FileUtil";
import {DataMapper} from "../util/DataMappers";
import {Layout, plot, stack} from "nodeplotlib";
import {DataTransform} from "../util/DataTransform";


export class Fingerprint {

  name : string;
  path : string;
  _data : AppFingerprintFormat;

  constructor(fingerprintPath?: string) {
    if (fingerprintPath) {
      this.name = path.basename(fingerprintPath);
      this.path = fingerprintPath;
    }
  }

  getAppData() : AppFingerprintFormat {
    if (this._data) { return this._data; }
    let data = FileUtil.readJSON<AppFingerprintFormat>(this.path);
    this.setData(data);
    return this._data;
  }

  setData(data : AppFingerprintFormat) {
    this._data = data;
    applySimulationConfig(this._data);
  }

  writeToTempFile(tmpFilePath = TMP_FINGERPRINT_PATH) {
    FileUtil.store(tmpFilePath, this.getLibData());
  }


  getCrownstoneMap(sphereId: string) : CrownstoneMap {
    this.getAppData();
    let allCrownstones = {}
    let fingerprints = this._data.spheres[sphereId].fingerprints
    for (let locationId in fingerprints) {
      for (let datapoint of fingerprints[locationId].fingerprint) {
        for (let deviceId in datapoint.devices) {
          allCrownstones[deviceId] = true;
        }
      }
    }
    return allCrownstones;
  }

  getLocationNameMap() : LocationNameMap {
    this.getAppData();
    let result = {};
    for (let sphereId in this._data.spheres) {
      result[sphereId] = {};
      let locations = this._data.spheres[sphereId].fingerprints;
      for (let locationId in locations) {
        result[sphereId][locationId] = locations[locationId].name;
      }
    }
    return result;
  }


  getSphereNameMap() : SphereNameMap {
    this.getAppData();
    let result = {};
    for (let sphereId in this._data.spheres) {
      result[sphereId] = this._data[sphereId].spheres.name;
    }
    return result;
  }


  getLibData() : FingerprintLibFileFormat {
    return DataMapper.AppFingerprintToLibs(this.getAppData());
  }


  convertToDatasets() : Dataset[] {
    let datasets = DataMapper.AppFingerprintToAppDatasets(this.getAppData());
    let result : Dataset[] = [];
    for (let set of datasets) {
      let dataset = new Dataset();
      dataset.setData(set);
      result.push(dataset);
    }
    return result;
  }


  plotSummary(rssiThreshold: number = -100, width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let datasets = this.convertToDatasets();
    for (let dataset of datasets) {
      dataset.plotDistanceReport(width, height*1.75, `${dataset.sphereName}:${dataset.locationName} distance`);
      dataset.plotRssiOverview(width, height*1.75, `${dataset.sphereName}:${dataset.locationName} rssi distribution`, rssiThreshold);
    }
    plot()
  }


  compareLocations(sphereId : string, locationUid1: string | number, locationUid2: string | number, width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let datasets = this.convertToDatasets()
    let dataset1 = getDataset(sphereId, String(locationUid1), datasets);
    let dataset2 = getDataset(sphereId, String(locationUid2), datasets);
    let [plotData, stepSize] = compareByDistance(dataset1._data.dataset, dataset2._data.dataset);

    let layout : Layout = {
      title: `Distance between ${dataset1.locationName} and ${dataset2.locationName} (D=${stepSize})`,
      width: width,
      height: height,
      xaxis:{title:dataset2.locationName},
      yaxis:{title:dataset1.locationName},
      ...PLOT_MARGINS,
    }

    stack([plotData], layout);
    let [plotData2, stepSize2] = compareByDistance(dataset1._data.dataset, dataset2._data.dataset, true);

    let layout2 : Layout = {
      title: `Compared items ${dataset1.locationName} and ${dataset2.locationName} (D=${stepSize})`,
      width: width,
      height: height,
      xaxis:{title:dataset2.locationName},
      yaxis:{title:dataset1.locationName},
      ...PLOT_MARGINS,
    }

    stack([plotData2], layout2);
    plot()
  }
}

function getDataset(sphereId: string, locationUid: string, datasets: Dataset[]) {
  for (let set of datasets) {
    if (!set._data) {
      set.getAppData();
    }

    if (set.sphereId === sphereId && locationUid === set.locationId) {
      return set;
    }
  }
  throw new Error("Dataset not found.");
}

function applySimulationConfig(fingerprints: AppFingerprintFormat) {
  applyRssiThreshold(fingerprints);
  applyDistanceConversion(fingerprints);
  applyInterpolation(fingerprints);
}

function applyRssiThreshold(fingerprints: AppFingerprintFormat) {
  for (let sphereId in fingerprints.spheres) {
    let sphere = fingerprints.spheres[sphereId];
    for (let locationId in sphere.fingerprints) {
      let data = sphere.fingerprints[locationId].fingerprint;
      if (SIMULATION_CONFIG.fingerprints.rssiUpperThreshold !== -100) {
        DataTransform.applyRssiUpperThreshold(data, SIMULATION_CONFIG.fingerprints.rssiUpperThreshold);
      }

      if (SIMULATION_CONFIG.fingerprints.rssiLowerThreshold !== 0) {
        DataTransform.applyRssiLowerThreshold(data, SIMULATION_CONFIG.fingerprints.rssiLowerThreshold);
      }
    }
  }
}

function applyDistanceConversion(fingerprints: AppFingerprintFormat) {
  if (SIMULATION_CONFIG.conversion.rssiToDistance === false) {
    return;
  }


  for (let sphereId in fingerprints.spheres) {
    let sphere = fingerprints.spheres[sphereId];
    for (let locationId in sphere.fingerprints) {
      let data = sphere.fingerprints[locationId].fingerprint;
      DataTransform.applyDistanceConversion(data);
    }
  }
}


function applyInterpolation(fingerprints: AppFingerprintFormat) {
  if (SIMULATION_CONFIG.interpolation.fingerprint === false) {
    return;
  }

  for (let sphereId in fingerprints.spheres) {
    let sphere = fingerprints.spheres[sphereId];
    for (let locationId in sphere.fingerprints) {
      let data = sphere.fingerprints[locationId].fingerprint;
      DataTransform.applyInterpolation(data, true);
    }
  }

}

