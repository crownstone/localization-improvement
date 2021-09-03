import path from "path";

export const TMP_FINGERPRINT_PATH  = path.join(__dirname,'/../../tmp/Fingerprint.json');
export const TMP_DATASET_PATH      = path.join(__dirname,'/../../tmp/Dataset.json');
export const TMP_OUTPUT_PATH_BASE  = path.join(__dirname,'/../../tmp/');
export const WEKA_FINGERPRINT_PATH = path.join(__dirname,'/../../weka/training-sets/');
export const WEKA_DATASET_PATH     = path.join(__dirname,'/../../weka/test-sets/');

export const WEKA_JAR_PATH         = path.join(__dirname,'/../lib/weka.jar');
export const AUTO_WEKA_JAR_PATH    = path.join(__dirname,'/../../autoweka/autoweka.jar');

export const USER_PATH = path.join(__dirname,'/../../datasets/users');

export const PLOT_MARGINS = {margin: {l: 150, r: 200, t: 100, b: 50}}
export const PLOT_DEFAULT_WIDTH = 1500;
export const PLOT_DEFAULT_HEIGHT = 400;

export const SIMULATION_CONFIG = {
  fingerprints: {
    rssiUpperThreshold: -100,
  },
  datasets: {
    rssiUpperThreshold: -100,
  },
  conversion: {
    rssiToDistance: false,
    minDistanceMeters: 0.75, // about -50
    maxDistanceMeters: 7.5   // about -90
  },
  interpolation: {
    fingerprint:     false,
    datasets:        false,
    require2points:  false,
    rssiThreshold:   -90,
    timespanSeconds: 3, // N seconds to look in front and/or behind.
  }
}