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

  AppDatasetToLibs: function(appDatasetData: AppDatasetFormat | string) : DatasetFileLibFormat {
    if (typeof appDatasetData === 'string') {
      appDatasetData = JSON.parse(appDatasetData) as AppDatasetFormat;
    }

    let result : DatasetFileLibFormat = [];
    for (let fingerprintDatapoint of appDatasetData.dataset) {
      let input = [];
      for (let uuid in fingerprintDatapoint) {
        input.push([uuid, fingerprintDatapoint[uuid]])
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
}