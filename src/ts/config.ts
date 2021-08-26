import path from "path";

export const TMP_FINGERPRINT_PATH = path.join(__dirname,'/../../tmp/Fingerprint.json');
export const TMP_DATASET_PATH     = path.join(__dirname,'/../../tmp/Dataset.json');
export const TMP_OUTPUT_PATH_BASE = path.join(__dirname,'/../../tmp/');

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
  interpolation: {
    fingerprint:    false,
    datasets:       false,
    require2points: false,
    timespan:       2, // two seconds to look in front and/or behind.
  }
}