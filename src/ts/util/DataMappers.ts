import {Dataset} from "../dataContainers/Dataset";
import {Fingerprint} from "../dataContainers/Fingerprint";
import {Arff} from "../arff/Arff";
import {Util} from "./Util";

export const DataMapper = {

  AppFingerprintToLibs: function(appFingerprintData: AppFingerprintFormat | string) : FingerprintLibFileFormat {
    if (typeof appFingerprintData === 'string') {
      appFingerprintData = JSON.parse(appFingerprintData) as AppFingerprintFormat;
    }

    let result : FingerprintLibFileFormat = [];
    for (let sphereId in appFingerprintData.spheres) {
      let sphere = appFingerprintData.spheres[sphereId];
      for (let locationId in sphere.fingerprints) {
        result.push({
          sphereId,
          locationId,
          data: sphere.fingerprints[locationId].fingerprint
        })
      }
    }
    return result;
  },

  AppDatasetToLibs: function(appDatasetData: AppDatasetFormat | string, ) : DatasetFileLibFormat {
    if (typeof appDatasetData === 'string') {
      appDatasetData = JSON.parse(appDatasetData) as AppDatasetFormat;
    }

    let result : DatasetFileLibFormat = [];
    for (let fingerprintDatapoint of appDatasetData.dataset) {
      let input = [];
      for (let uuid in fingerprintDatapoint.devices) {
        input.push([uuid, fingerprintDatapoint.devices[uuid]])
      }
      result.push({
        in: input,
        label: appDatasetData.location.uid,
        sphereId: appDatasetData.sphereCloudId,
      });
    }
    return result;
  },

  AppFingerprintToAppDatasets: function(appFingerprintData: AppFingerprintFormat) : AppDatasetFormat[] {
    let result : AppDatasetFormat[] = [];
    for (let sphereId in appFingerprintData.spheres) {
      let sphere = appFingerprintData.spheres[sphereId];
      for (let locationId in sphere.fingerprints) {
        let location = sphere.fingerprints[locationId];
        result.push({
          sphereCloudId: sphereId,
          sphere: sphere.sphere,
          annotation: "Converted from fingerprint",
          location: {
            name: location.name,
            uid: locationId
          },
          dataset: location.fingerprint
        });

      }
    }


    return result;
  },

  DatasetToWeka: function(dataset: Dataset, fingerprint: Fingerprint, crownstoneMap : CrownstoneMap, locationLabels: string[]) : Arff {
    let data = dataset.getAppData();
    let crownstones = Object.keys(crownstoneMap);

    let arff = new Arff(dataset.name);
    arff.addNumericAttribute(crownstones);
    arff.addNominalAttribute('label',locationLabels);

    let locationNameMap = fingerprint.getLocationNameMap();
    for (let datapoint of data.dataset) {
      let dataRowInput = Util.deepCopy(datapoint.devices);
      dataRowInput['label'] = DataMapper.getLocationLabel(dataset.locationId, locationNameMap[dataset.sphereId][dataset.locationId]);
      arff.addData(dataRowInput);
    }

    return arff;
  },

  FingerprintToWeka: function(sphereId: string, fingerprint: Fingerprint, crownstoneMap : CrownstoneMap = {}, locationLabels: string[] = []) : Arff {
    Util.deepExtend(crownstoneMap, fingerprint.getCrownstoneMap(sphereId));

    let locationNameMap = fingerprint.getLocationNameMap();
    if (locationLabels.length === 0) {
      locationLabels = DataMapper.getLocationLabels(sphereId, locationNameMap);
    }

    let arff = new Arff(fingerprint.name);

    arff.addNumericAttribute(Object.keys(crownstoneMap));
    arff.addNominalAttribute('label',locationLabels);

    let datasets = fingerprint.convertToDatasets();
    for (let dataset of datasets) {
      if (dataset.sphereId !== sphereId) { continue; }

      for (let datapoint of dataset.getAppData().dataset) {
        let dataRowInput = Util.deepCopy(datapoint.devices);
        dataRowInput['label'] = DataMapper.getLocationLabel(dataset.locationId, locationNameMap[dataset.sphereId][dataset.locationId]);
        arff.addData(dataRowInput);
      }
    }

    return arff;
  },

  getLocationLabels: function(sphereId: string, locationNameMap: LocationNameMap) : string[] {
    let locationNames = [];
    for (let locationId in locationNameMap[sphereId]) {
      locationNames.push(DataMapper.getLocationLabel(locationId, locationNameMap[sphereId][locationId]));
    }
    return locationNames;
  },

  getLocationLabel(locationId : string, name: string) {
    return `${locationId}_${name}`
  }
}