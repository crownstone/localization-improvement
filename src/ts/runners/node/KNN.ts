type sphereId = string;
type locationId = string;
type deviceId = string;



export class KNN implements ClassifierInterface {
  name = 'nodeKNN';

  fingerprints    : Record<sphereId, Record<locationId, number[][]>> = {};
  sphereDeviceMap = {};
  sortedSphereKeys : Record<string,string[]> = {};

  constructor() {}

  train(fingerprints: AppFingerprintFormat) {
    let fingerprintSet = {};
    this.fingerprints  = {};
    this.sphereDeviceMap = {};
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

      this.sortedSphereKeys[sphereId] = Object.keys(this.sphereDeviceMap[sphereId]).sort()

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
        }
      }
    }
  }

  classify(inputVector : FingerprintDatapoint, sphereId: string) : LocationId {
    let sphereFingerprint = this.fingerprints[sphereId];

    let vector = [];
    for (let key of this.sortedSphereKeys[sphereId]) {
      if (inputVector.devices[key]) {
        vector.push(sigmoid(inputVector.devices[key]));
      }
      else {
        vector.push(1);
      }
    }

    let label;
    let minDistance = Infinity
    for (let locationId in sphereFingerprint) {
      for (let dataVector of sphereFingerprint[locationId]) {
        let distance = this.getDistance(vector, dataVector);
        if (distance < minDistance) {
          minDistance = distance;
          label = locationId;
        }
      }
    };

    return label;
  }

  clear() {
    this.fingerprints = {};
  }


  getDistance(vector: number[], fingerprint: number[]) {
    let d = 1
    let length = 0;
    for (let i = 0; i < vector.length; i++) {
      let x = vector[i];
      let y = fingerprint[i];
      if (y) {
        length++
        d += 2 * (Math.pow(x, 2) + Math.pow(y, 2) - 1.95 * x * y)
      }
    }

    return d / (2.0*length);
  }
}




function sigmoid(rssi) {
  let smooth_f = 0.1;
  return (1 / (1 + Math.exp((rssi + 50)*smooth_f)));
}