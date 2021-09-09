import {AddTitle} from "../../util/PlotUtil";
import {plot} from "nodeplotlib";


export class NaiveBayesian {

  MINIMUM_STD = 3

  fingerprints = {};
  sampleSize = {};
  probability = {};

  MINIMUM_REQUIRED_SAMPLES = 3;
  PROBABILITY_MINIMUM = 1e-9;
  MINIMUM_RSSI = -60;

  constructor() {}

  train(fingerprints: AppFingerprintFormat) {
    let fingerprintSet = {};
    this.fingerprints  = {};
    for (let sphereId in fingerprints.spheres) {
      let sphere = fingerprints.spheres[sphereId];
      if (fingerprintSet[sphereId] === undefined) {
        fingerprintSet[sphereId] = {};
        this.fingerprints[sphereId] = {};
      }

      for (let locationId in sphere.fingerprints) {
        let location = sphere.fingerprints[locationId];

        if (fingerprintSet[sphereId][locationId] === undefined) {
          fingerprintSet[sphereId][locationId] = {};
          this.fingerprints[sphereId][locationId] = {};
        }

        for (let datapoint of location.fingerprint) {
          for (let deviceId in datapoint.devices) {
            if (fingerprintSet[sphereId][locationId][deviceId] === undefined) {
              fingerprintSet[sphereId][locationId][deviceId] = [];
              this.fingerprints[sphereId][locationId][deviceId] = {};
            }
            fingerprintSet[sphereId][locationId][deviceId].push(datapoint.devices[deviceId])
          }
        }
      }
    }

    for (let sphereId in fingerprintSet) {
      for (let locationId in fingerprintSet[sphereId]) {
        let locationData = fingerprintSet[sphereId][locationId];
        for (let crownstoneId in locationData) {
          this.fingerprints[sphereId][locationId][crownstoneId] = fitGaussian(locationData[crownstoneId])
        }
      }
    }
  }

  classify(inputVector : FingerprintDatapoint, sphereId: string) : LocationId {
    let probabilities = {};
    let sphereFingerprint = this.fingerprints[sphereId];

    // let max = 0;
    let maxLabel;
    let maxProbability = -Infinity
    for (let locationId in sphereFingerprint) {
      let probability = 1;
      let sampleCount = 0;
      for (let stoneId in sphereFingerprint[locationId]) {
        let measuredValue = inputVector.devices[stoneId];
        if (measuredValue !== undefined) {
          let summary = sphereFingerprint[locationId][stoneId];
          let exponent = Math.exp(-(Math.pow(measuredValue - summary.mean,2)/(2*Math.pow(summary.std,2))));
          let stoneProbability = exponent / (Math.sqrt(2*Math.PI) * summary.std);
          probability *= stoneProbability;
          sampleCount++;
        }
      }

      // require at least this.MINIMUM_REQUIRED_SAMPLES samples in a fingerprint
      if (sampleCount >= this.MINIMUM_REQUIRED_SAMPLES) {
        probability = Math.pow(probability, 1 / sampleCount);
      }
      else {
        probability = 0;
      }
      probabilities[locationId] = probability;
      this.sampleSize[locationId] = sampleCount;

      if (maxProbability < probability) {
        maxProbability = probability;
        maxLabel = locationId;
      }
    };

    this.probability = probabilities;


    return maxLabel;
  }

  clear() {
    this.fingerprints = {};
  }


  _processValue(rssi, applyMin = true) {
    return rssi;
  }
}


function getMean(measurements) {
  var total = 0;
  measurements.forEach((element) => {
    total += element;
  })
  return (total / measurements.length)
}

function getStd(measurements, mean) {
  var total = 0;
  measurements.forEach((element) => {
    total += Math.pow(element - mean,2);
  });
  var variance = (total / measurements.length);
  return Math.sqrt(variance);
}

export function fitGaussian(RSSIs: Number[]) {
  let mean = getMean(RSSIs)
  let std = getStd(RSSIs, mean)

  // do not allow small standard deviations
  if (std < 3) {
    std = 3;
  }
  return {mean: mean, std: std};
}