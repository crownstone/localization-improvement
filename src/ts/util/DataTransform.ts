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
    let timeSearchThreshold = SIMULATION_CONFIG.interpolation.timespan;
    for (let i = dataContainer.length - 1; i >= 1; i--) {
      let previousPoint = dataContainer[i-1];
      let datapoint = dataContainer[i];

      // if the data was in the previous point, but not in the current, we need to interpolate.
      for (let deviceId in previousPoint.devices) {
        if (datapoint.devices[deviceId] === undefined) {
          // interpolate!
          linearInterpolate(dataContainer, i, deviceId, timeSearchThreshold, allowForwardLookup);
        }
      }
    }
  },

}


export function linearInterpolate(dataset: FingerprintDatapoint[], forIndex: number, deviceId: string, timeSearchThreshold: number, allowForwardLookup:boolean) {
  let timestamp = dataset[forIndex].timestamp;
  let t_min1    = dataset[forIndex-1].timestamp;

  // if the previous measurement was not within the allowed search threshold, we do not need to interpolate
  if (timestamp - t_min1 <= timeSearchThreshold) {
    return;
  }

  let value_min1 = dataset[forIndex-1].devices[deviceId];
  let value_plus1 = dataset[forIndex+1]?.devices[deviceId];

  let t_plus1 = dataset[forIndex+1]?.timestamp ?? null;

  // if we have a future point and it is within range, we can use that.
  if (allowForwardLookup && value_plus1 && t_plus1 - timestamp <= timeSearchThreshold) {
    let dx = value_plus1 - value_min1;
    let dt = t_plus1 - t_min1;
    // average between the 2 values
    dataset[forIndex].devices[deviceId] = value_min1 + (dx/dt)*(timestamp - t_min1);

    // dx = -50 - -70 = 20
    // dt = 2
    // int = -70 + (20/2)*1 = -60
    return;
  }

  let t_min2 = dataset[forIndex-2]?.timestamp;
  let value_min2 = dataset[forIndex-2]?.devices[deviceId];

  // if we have a value min2 and the time falls within the threshold, use that.
  if (value_min2 && timestamp - t_min2 <= timeSearchThreshold) {
    // get a dx
    let dx = value_min1 - value_min2;
    let dt = t_min1 - t_min2;
    dataset[forIndex].devices[deviceId] = value_min1 + (dx/dt)*(timestamp - t_min1);
    // -60 - -70 = 10
    // -60 + 10 = -50
  }
  else if (SIMULATION_CONFIG.interpolation.require2points === false) {
    // copy
    dataset[forIndex].devices[deviceId] = value_min1;
  }
}