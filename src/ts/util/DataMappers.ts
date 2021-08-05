export const DataMapper = {

  AppFingerprintToLibs: function(appFingerprintData: AppFingerprintFormat | string) : FingerprintLibFileFormat {
    if (typeof appFingerprintData === 'string') {
      appFingerprintData = JSON.parse(appFingerprintData) as AppFingerprintFormat;
    }


    let result : FingerprintLibFileFormat = [];
    for (let sphereId in appFingerprintData.spheres) {
      let sphere = appFingerprintData.spheres[sphereId];
      for (let locationId in sphere) {
        result.push({
          sphereId,
          locationId,
          data: sphere[locationId].fingerprint
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
    for (let datapointArray of appDatasetData.dataset) {
      result.push({
        in: datapointArray.map((item) => item.slice(1)) as LibDatapoint[],
        label: appDatasetData.location.uid,
        sphereId: appDatasetData.sphereCloudId,
      });
    }
    return result;
  },
}