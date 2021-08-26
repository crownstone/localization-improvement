import {Collective} from "../dataContainers/Collective";
import {SIMULATION_CONFIG} from "../config";

let processingMap = {
  "Alex_de_Mulder": {
    "homeV1": {
      "fingerprint.v1.json": {
        "Localization_Dataset_Badkamer_9_2021-08-24 18_06_09.json": true,
        "Localization_Dataset_Gang Boven_14_2021-08-24 17_32_07.json": true,
        "Localization_Dataset_Gang_2_2021-08-24 17_21_44.json": true,
        "Localization_Dataset_Keuken_4_2021-08-24 16_39_46.json": true,
        "Localization_Dataset_Living room_5_2021-08-24 17_13_56.json": true,
        "Localization_Dataset_Logeerkamer_11_2021-08-24 17_45_56.json": true,
        "Localization_Dataset_Slaapkamer_3_2021-08-24 18_20_26.json": true,
        "Localization_Dataset_Studeerkamer_1_2021-08-25 9_51_53.json": true,
        "Localization_Dataset_Voordakkapel_12_2021-08-25 10_03_09.json": true,
        "Localization_Dataset_Washok_10_2021-08-24 17_55_50.json": true,
        "Localization_Dataset_Wc Beneden_15_2021-08-25 10_19_14.json": true,
        "Localization_Dataset_Wc Boven_13_2021-08-25 10_11_12.json": true,
        "Localization_Dataset_Workshop_16_2021-08-24 16_57_01.json": true,
      }
    }
  },
}


async function run() {
  SIMULATION_CONFIG.interpolation.datasets = true;
  SIMULATION_CONFIG.interpolation.fingerprint = true;
  SIMULATION_CONFIG.interpolation.require2points = false;

  let collective = new Collective()
  collective.loadMap(processingMap);
  await collective.runSets();

  // for (let set of collective.testSets) {
  //   for (let dataset of set.datasets) {
  //     dataset.plotSummary()
  //   }
  // }
  // for (let set of collective.testSets) {
  //   for (let datasetName in set.results) {
  //     set.results[datasetName].plotSummary()
  //   }
  // }
  //
  collective.plotSummary()
};

run()

