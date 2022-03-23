import {fitGaussian} from "./NaiveBayesian";
import {plot, stack} from "nodeplotlib";
import {Util} from "../../util/Util";
import {AddTitle} from "../../util/PlotUtil";


export class NaiveBayesianGaussianMixture implements ClassifierInterface {
  name = 'nodeNaiveBayesianGaussianMixture';

  MINIMUM_STD = 1;
  fingerprints = {};
  sampleSize = {};
  probability = {};

  MINIMUM_REQUIRED_SAMPLES = 3;

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
        // AddTitle(fingerprints.spheres[sphereId].sphere.name + "  " + fingerprints.spheres[sphereId].fingerprints[locationId].name)
        for (let crownstoneId in locationData) {
          this.fingerprints[sphereId][locationId][crownstoneId] = fitMultipleGaussians(locationData[crownstoneId], crownstoneId, this.MINIMUM_STD);
        }
        // plot()
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


function fitMultipleGaussians(RSSIs: number[], crownstoneId: string, minStd) {
  let count : any = {}
  for (let value of RSSIs) {
    let val = String(value)
    if (count[val] === undefined) {
      count[val] = 0
    }
    count[val] += 1;
  }

  let x = []
  let y = [];
  for (let item in count) {
    x.push(Number(item))
    y.push(count[item])
  }

  let sum = 0
  for (let yval of y) {
    sum += yval;
  }

  y = y.map(val => val / sum)

  sum = 0
  for (let yval of y) {
    sum += yval;
  }
  let gaussian = fitGaussian(RSSIs, minStd);

  let xx = Util.deepCopy(x)
  xx.sort();

  let max = xx[0];
  let min = xx[xx.length-1];
  let xxx = [];
  let yyy = [];
  let steps = 100;
  for (let i = 0; i < steps; i++) {
    xxx.push((i / steps) * (max - min) + min)
  }
  for (let val of xxx) {
    let exponent = Math.exp(-(Math.pow(val - gaussian.mean,2)/(2*Math.pow(gaussian.std,2))));
    let stoneProbability = exponent / (Math.sqrt(2*Math.PI) * gaussian.std);
    yyy.push(stoneProbability)
  }

  stack([{x,y, type:'bar',}, {x:xxx,y:yyy}],{title: crownstoneId, height: 500})
}

function plotFitMultipleGaussians(RSSIs: number[], crownstoneId: string, minStd) {
  let count : any = {}
  for (let value of RSSIs) {
    let val = String(value)
    if (count[val] === undefined) {
      count[val] = 0
    }
    count[val] += 1;
  }

  let x = []
  let y = [];
  for (let item in count) {
    x.push(Number(item))
    y.push(count[item])
  }

  let sum = 0
  for (let yval of y) {
    sum += yval;
  }

  y = y.map(val => val / sum)

  sum = 0
  for (let yval of y) {
    sum += yval;
  }
  let gaussian = fitGaussian(RSSIs, minStd);

  let xx = Util.deepCopy(x)
  xx.sort();

  let max = xx[0];
  let min = xx[xx.length-1];
  let xxx = [];
  let yyy = [];
  let steps = 100;
  for (let i = 0; i < steps; i++) {
    xxx.push((i / steps) * (max - min) + min)
  }
  for (let val of xxx) {
    let exponent = Math.exp(-(Math.pow(val - gaussian.mean,2)/(2*Math.pow(gaussian.std,2))));
    let stoneProbability = exponent / (Math.sqrt(2*Math.PI) * gaussian.std);
    yyy.push(stoneProbability)
  }

  stack([{x,y, type:'bar',}, {x:xxx,y:yyy}],{title: crownstoneId, height: 500})
}