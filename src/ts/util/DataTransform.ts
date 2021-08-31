import {SIMULATION_CONFIG} from "../config";
import {Util} from "./Util";

export const DataTransform = {

  applyRssiThreshold: function(dataContainer: FingerprintDatapoint[], threshold) {
    for (let datapoint of dataContainer) {
      for (let deviceId in datapoint.devices) {
        if (datapoint.devices[deviceId] < threshold) {
          delete datapoint.devices[deviceId];
        }
      }
    }
  },

  applyDistanceConversion: function(dataContainer: FingerprintDatapoint[]) {
    for (let datapoint of dataContainer) {
      for (let deviceId in datapoint.devices) {
        datapoint.devices[deviceId] = Math.min(
          SIMULATION_CONFIG.conversion.maxDistanceMeters,
          Math.max(
            SIMULATION_CONFIG.conversion.minDistanceMeters,
            Util.rssiToDistance(datapoint.devices[deviceId])
          )
        );
      }
    }
  },

  applyInterpolation: function(dataContainer: FingerprintDatapoint[], allowForwardLookup: boolean) {
    let timeSearchThreshold = SIMULATION_CONFIG.interpolation.timespanSeconds;

    let lookupMap = {};
    for (let point of dataContainer) {
      Util.mapMerge(lookupMap, Object.keys(point.devices));
    }

    for (let i = dataContainer.length - 1; i >= 1; i--) {
      let datapoint = dataContainer[i];

      // if the data was in the previous point, but not in the current, we need to interpolate.
      for (let deviceId in lookupMap) {
        if (datapoint.devices[deviceId] === undefined) {
          // interpolate!
          linearInterpolate(dataContainer, i, deviceId, timeSearchThreshold*1000, allowForwardLookup);
        }
      }
    }
  },

}


export function linearInterpolate(dataset: FingerprintDatapoint[], forIndex: number, deviceId: string, timeSearchThresholdMs: number, allowForwardLookup:boolean) {
  let timestamp = dataset[forIndex].timestamp;

  // look for previous item
  let previousItems = [];
  let futureItems   = [];
  let searchedForFutureItems = false;

  function getFutureItems() {
    if (searchedForFutureItems) { return; }
    searchedForFutureItems = true;

    for (let i = forIndex + 1; i < dataset.length; i++) {
      let dt = dataset[i].timestamp - timestamp;
      if (dt > timeSearchThresholdMs) {
        break;
      }

      if (dataset[i].devices[deviceId] !== undefined) {
        futureItems.push(dataset[i]);
        break;
      }
    }
  }

  // search for previous items.
  for (let i = forIndex - 1; i >= 0; i--) {
    let dt = timestamp - dataset[i].timestamp;
    if (dt > timeSearchThresholdMs) {
      break;
    }

    if (dataset[i].devices[deviceId] !== undefined) {
      previousItems.push(dataset[i]);
      if (previousItems.length === 2) {
        break;
      }
    }
  }

  // nothing to base interpolation on.
  if (previousItems.length === 0) { return; }

  if (allowForwardLookup) {
    getFutureItems();
    if (previousItems.length > 0 && futureItems.length > 0) {
        let dx = futureItems[0].devices[deviceId] - previousItems[0].devices[deviceId];
        let dt = futureItems[0].timestamp - previousItems[0].timestamp;
        let result = previousItems[0].devices[deviceId] + (dx/dt)*(timestamp - previousItems[0].timestamp);
        if (result > SIMULATION_CONFIG.interpolation.rssiThreshold) {
          dataset[forIndex].devices[deviceId] = result;
        }
        // dx = -50 - -70 = 20
        // dt = 2
        // int = -70 + (20/2)*1 = -60
        return;
    }
  }

  if (previousItems.length === 1) {
    if (SIMULATION_CONFIG.interpolation.require2points === false) {
      dataset[forIndex].devices[deviceId] = previousItems[0].devices[deviceId];
      return
    }
  }


  if (previousItems.length > 1) {
    // get a dx
    let dx = previousItems[0].devices[deviceId] - previousItems[1].devices[deviceId];
    let dt = previousItems[0].timestamp - previousItems[1].timestamp;
    let result = previousItems[0].devices[deviceId] + (dx/dt)*(timestamp - previousItems[0].timestamp);
    if (result > SIMULATION_CONFIG.interpolation.rssiThreshold) {
      dataset[forIndex].devices[deviceId] = result;
    }

    // -60 - -70 = 10
    // -60 + 10 = -50
    return;
  }
}