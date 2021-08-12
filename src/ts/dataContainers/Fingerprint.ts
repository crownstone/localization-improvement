import path from "path";
import {Dataset} from "./Dataset";
import {TMP_FINGERPRINT_PATH} from "../config";
import {FileUtil} from "../util/FileUtil";
import {DataMapper} from "../util/DataMappers";


export class FingerprintsBase {
  getLibData() : FingerprintLibFileFormat {
    throw "MUST_BE_IMPLEMENTED"
  }

  writeToTempFile(tmpFilePath = TMP_FINGERPRINT_PATH) {
    FileUtil.store(tmpFilePath, this.getLibData());
  }

  getLocationNameMap() : LocationNameMap {
    throw "OVERRIDE"
  }
}


// export class FingerprintsBuilder extends FingerprintsBase {
//
//   sphereId:     string;
//   locations:  { [locationId: string]: FingerprintDatapoint[] } = {};
//   locationNameMap = {};
//
//   constructor(sphereId: string) {
//     super();
//     this.sphereId = sphereId;
//     this.locationNameMap[this.sphereId] = {};
//   }
//
//   getLocationNameMap() {
//     return this.locationNameMap;
//   }
//
//   loadDatapointForLocation(locationName: string, locationId : string, datapoint: FingerprintDatapoint | FingerprintDatapoint[]) {
//     this.locationNameMap[this.sphereId][locationId] = locationName;
//
//     if (this.locations[locationId] === undefined) {
//       this.locations[locationId] = [];
//     }
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
//     return result;
//   }
// }

export class FingerprintSet extends FingerprintsBase {

  name : string;
  path : string;
  data : AppFingerprintFormat;
  constructor(fingerprintPath: string) {
    super();
    this.name = path.basename(fingerprintPath);
    this.path = fingerprintPath;
  }

  getAppData() : AppFingerprintFormat {
    if (this.data) { return this.data; }
    this.data = FileUtil.readJSON<AppFingerprintFormat>(this.path);
    return this.data;
  }

  getLocationNameMap() : LocationNameMap {
    this.getAppData();
    let result = {};
    for (let sphereId in this.data.spheres) {
      result[sphereId] = {};
      let locations = this.data.spheres[sphereId];
      for (let locationId in locations) {
        result[sphereId][locationId] = locations[locationId].name;
      }
    }
    return result;
  }

  getLibData() : FingerprintLibFileFormat {
    return DataMapper.AppFingerprintToLibs(this.getAppData());
  }

  convertToDatasets(tmpTransformedPath: string) : Dataset[] {
    let datasets = DataMapper.AppFingerprintToAppDatasets(this.getAppData());
    let result : Dataset[] = [];
    for (let set of datasets) {
      let dataset = new Dataset();
      dataset.data = set;
      result.push(dataset);
    }
    return result;
  }

  getRandomSample(sphereId: string, locationId: string) : FingerprintDatapoint {
    let data = this.getAppData();
    let samples = data.spheres[sphereId].fingerprints[locationId].fingerprint;
    let index = Math.floor(Math.random()*samples.length);
    return samples[index];
  }
}

