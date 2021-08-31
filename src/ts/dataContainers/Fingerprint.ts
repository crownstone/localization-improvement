import path from "path";
import {compareByDistance, Dataset} from "./Dataset";
import {
  PLOT_DEFAULT_HEIGHT,
  PLOT_DEFAULT_WIDTH,
  PLOT_MARGINS,
  SIMULATION_CONFIG, TMP_DATASET_PATH,
  TMP_FINGERPRINT_PATH
} from "../config";
import {FileUtil} from "../util/FileUtil";
import {DataMapper} from "../util/DataMappers";
import {Layout, plot, stack} from "nodeplotlib";
import {Util} from "../util/Util";
import {DataTransform} from "../util/DataTransform";


export class FingerprintBase {

  name: string;

  getLibData() : FingerprintLibFileFormat {
    throw "MUST_BE_IMPLEMENTED"
  }

  writeToTempFile(tmpFilePath = TMP_FINGERPRINT_PATH) {
    FileUtil.store(tmpFilePath, this.getLibData());
  }

  getLocationNameMap() : LocationNameMap {
    throw "OVERRIDE_IN_CHILD_CLASS"
  }

  getSphereNameMap() : SphereNameMap {
    throw "OVERRIDE_IN_CHILD_CLASS"
  }
}


// export class FingerprintsBuilder extends FingerprintBase {
//
//   sphereId:     string;
//   locations:  { [locationId: string]: FingerprintDatapoint[] } = {};
//   locationNameMap : LocationNameMap = {};
//   sphereNameMap   : SphereNameMap = {};
//
//   constructor(sphereId: string, sphereName: string) {
//     super();
//     this.sphereId = sphereId;
//     this.locationNameMap[this.sphereId] = {};
//     this.sphereNameMap[this.sphereId] = sphereName;
//   }
//
//   getLocationNameMap() : LocationNameMap {
//     return this.locationNameMap;
//   }
//
//   getSphereNameMap() : SphereNameMap {
//     return this.sphereNameMap
//   }
//
//   loadDatapointForLocation(locationName: string, locationId : string, datapoint: FingerprintDatapoint | FingerprintDatapoint[], allowDuplicates = false) {
//     this.locationNameMap[this.sphereId][locationId] = locationName;
//
//     if (this.locations[locationId] === undefined) {
//       this.locations[locationId] = [];
//     }
//
//     // TODO: do not allow duplicates
//
//     if (Array.isArray(datapoint)) {
//       this.locations[locationId] = this.locations[locationId].concat(datapoint);
//     }
//     else {
//       this.locations[locationId].push(datapoint);
//     }
//   }
//
//   getLibData() : FingerprintLibFileFormat {
//     let result : FingerprintLibFileFormat = [];
//     for (let locationId in this.locations) {
//       result.push({
//         sphereId: this.sphereId,
//         locationId,
//         data: this.locations[locationId]
//       })
//     }
//
//     // applySimulationConfig(result);
//     return result;
//   }
// }

export class Fingerprint extends FingerprintBase {

  name : string;
  path : string;
  _data : AppFingerprintFormat;
  constructor(fingerprintPath: string) {
    super();
    this.name = path.basename(fingerprintPath);
    this.path = fingerprintPath;
  }

  getAppData() : AppFingerprintFormat {
    if (this._data) { return this._data; }
    this._data = FileUtil.readJSON<AppFingerprintFormat>(this.path);
    applySimulationConfig(this._data);
    return this._data;
  }

  getCrownstoneMap(sphereId: string) : CrownstoneMap {
    this.getAppData();
    let allCrownstones = {}
    console.log(sphereId)
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

  getRandomSample(sphereId: string, locationId: string) : FingerprintDatapoint {
    let data = this.getAppData();
    let samples = data.spheres[sphereId].fingerprints[locationId].fingerprint;
    let index = Math.floor(Math.random()*samples.length);
    return samples[index];
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
  if (SIMULATION_CONFIG.fingerprints.rssiUpperThreshold === -100) {
    return;
  }

  for (let sphereId in fingerprints.spheres) {
    let sphere = fingerprints.spheres[sphereId];
    for (let locationId in sphere.fingerprints) {
      let data = sphere.fingerprints[locationId].fingerprint;
      DataTransform.applyRssiThreshold(data, SIMULATION_CONFIG.fingerprints.rssiUpperThreshold);
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

