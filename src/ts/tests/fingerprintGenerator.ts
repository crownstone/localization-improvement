import {FileUtil} from "../util/FileUtil";
import {FingerprintGenerator} from "../dataContainers/FingerprintGenerator";
import {TestSet} from "../dataContainers/TestSet";
import {AddTitle} from "../util/PlotUtil";

async function runBatch(size) {
  let useDatasets = [
    "Localization_Dataset_Badkamer_9_2021-08-24 18_06_09.json",
    "Localization_Dataset_Gang Boven_14_2021-08-24 17_32_07.json",
    "Localization_Dataset_Gang_2_2021-08-24 17_21_44.json",
    "Localization_Dataset_Keuken_4_2021-08-24 16_39_46.json",
    "Localization_Dataset_Living room_5_2021-08-24 17_13_56.json",
    "Localization_Dataset_Logeerkamer_11_2021-08-24 17_45_56.json",
    "Localization_Dataset_Slaapkamer_3_2021-08-24 18_20_26.json",
    "Localization_Dataset_Studeerkamer_1_2021-08-25 9_51_53.json",
    "Localization_Dataset_Voordakkapel_12_2021-08-25 10_03_09.json",
    "Localization_Dataset_Washok_10_2021-08-24 17_55_50.json",
    "Localization_Dataset_Wc Beneden_15_2021-08-25 10_19_14.json",
    "Localization_Dataset_Wc Boven_13_2021-08-25 10_11_12.json",
    "Localization_Dataset_Workshop_16_2021-08-24 16_57_01.json",
  ]

  // let datasets = FileUtil.getDatasets(useDatasets);
  //
  // let gen = new FingerprintGenerator();
  //
  // gen.loadDatasets(datasets);
  // gen.generateFingerprintBasedOnDistance(size)
  //
  // let testSet = new TestSet()
  // testSet.loadDatasets(datasets);
  // testSet.loadFingerprint(gen.getFingerprint())
  //
  // await testSet.runAll(true)
  // AddTitle(`Fingerprint by distance size = ${size}`)
  // testSet.aggregatedResult.plotSummary()
}

async function run() {
  let sizes = [20,40,60,8,100,120,140,200];
  for (let size of sizes) {
    await runBatch(size)
  }
}
run()