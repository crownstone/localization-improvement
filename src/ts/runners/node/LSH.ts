type sphereId = string;
type locationId = string;
type deviceId = string;

const Lsh = require('@agtabesh/lsh')

export class LSH implements ClassifierInterface {
  name = 'nodeLSH';

  fingerprints    : Record<sphereId, Record<locationId, number[][]>> = {};
  sphereDeviceMap = {};
  sortedSphereKeys : Record<string,string[]> = {};

  lsh;

  constructor() {
    const config = {
      storage: 'memory',
      shingleSize: 5,
      numberOfHashFunctions: 120
    }
    this.lsh = Lsh.getInstance(config)
  }

  train(fingerprints: AppFingerprintFormat) {
    console.time("Training")
    let fingerprintSet = {};
    this.fingerprints  = {};
    this.sphereDeviceMap = {};
    let count = 0;
    for (let sphereId in fingerprints.spheres) {
      let sphere = fingerprints.spheres[sphereId];
      if (fingerprintSet[sphereId] === undefined) {
        fingerprintSet[sphereId] = {};
        this.fingerprints[sphereId] = {};
      }

      this.sphereDeviceMap[sphereId] = {};

      for (let locationId in sphere.fingerprints) {
        let location = sphere.fingerprints[locationId];
        for (let datapoint of location.fingerprint) {
          for (let deviceId in datapoint.devices) {
            this.sphereDeviceMap[sphereId][deviceId] = 1.0;
          }
        }
      }

      this.sortedSphereKeys[sphereId] = Object.keys(this.sphereDeviceMap[sphereId]).sort();

      for (let locationId in sphere.fingerprints) {
        let location = sphere.fingerprints[locationId];

        if (fingerprintSet[sphereId][locationId] === undefined) {
          fingerprintSet[sphereId][locationId] = {};
          this.fingerprints[sphereId][locationId] = [];
        }

        for (let datapoint of location.fingerprint) {
          let data = {...this.sphereDeviceMap[sphereId]};
          for (let deviceId in datapoint.devices) {
            data[deviceId] = sigmoid(datapoint.devices[deviceId]);
          }
          let dataArray : number[] = [];
          for (let key of this.sortedSphereKeys[sphereId]) {
            dataArray.push(data[key])
          }
          this.fingerprints[sphereId][locationId].push(dataArray);
          this.lsh.addDocument(`${locationId}_${count++}`, dataArray.join("  "))
        }
      }
    }
    console.timeEnd("Training")
  }

  classify(inputVector : FingerprintDatapoint, sphereId: string) : LocationId {
    console.time()
    let vector = [];
    for (let key of this.sortedSphereKeys[sphereId]) {
      if (inputVector.devices[key]) {
        vector.push(sigmoid(inputVector.devices[key]));
      }
      else {
        vector.push(1);
      }
    }

    let result = this.lsh.query({text:vector.join("  ")})
    console.timeEnd()
    return result[0].split("_")[0]
  }

  clear() {
    this.fingerprints = {};
  }
}




function sigmoid(rssi) {
  return rssi;
  let smooth_f = 0.1;
  return (1 / (1 + Math.exp((rssi + 50)*smooth_f)));
}