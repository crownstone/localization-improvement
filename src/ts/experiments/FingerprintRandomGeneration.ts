import {FileUtil} from "../util/FileUtil";
import {FingerprintGenerator} from "../dataContainers/FingerprintGenerator";
import {TestSet} from "../dataContainers/TestSet";
import {AddTitle} from "../util/PlotUtil";

let successRates = [];
async function runBatch(size) {
  console.log("Starting", size)
  let rates = []
  for (let i = 0; i < 10; i++) {
    console.time(size + "_Iteration_"+i)
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
    ];

    let datasets = FileUtil.getDatasets("Alex_de_Mulder", useDatasets);

    let gen = new FingerprintGenerator();
    gen.loadDatasets(datasets);
    gen.generateFingerprintRandomly(size);

    let fingerprint = gen.getFingerprint();

    let testSet = new TestSet();
    testSet.loadDatasets(datasets);
    testSet.loadFingerprint(fingerprint);
    await testSet.runAll(true);
    console.log(testSet.aggregatedResult.getTotalSuccessRate('58de6bda62a2241400f10c67'));
    rates.push( testSet.aggregatedResult.getTotalSuccessRate('58de6bda62a2241400f10c67'));
    console.timeEnd(size + "_Iteration_"+i);
  }

  let nbSum  = 0;
  let knnSum = 0;
  for (let r of rates) {
    nbSum  += r.naiveBayesian;
    knnSum += r.knn;
  }

  console.log(size, "NB", nbSum/rates.length, "KNN", knnSum/rates.length);
}

async function genWekaFiles() {
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
  ];

  let datasets = FileUtil.getDatasets("Alex_de_Mulder", useDatasets);

  let gen = new FingerprintGenerator();
  gen.loadDatasets(datasets);
  gen.generateFingerprintRandomly(300);

  let fingerprint = gen.getFingerprint();

  let testSet = new TestSet();
  testSet.loadDatasets(datasets);
  testSet.loadFingerprint(fingerprint);
  testSet.generateWekaFiles();

  // await testSet.runAll(true);
  // console.log(testSet.aggregatedResult.getTotalSuccessRate('58de6bda62a2241400f10c67'));
}

async function run() {
  let sizes = [20,40,60,80,100,120,140,200];
  for (let size of sizes) {
    await runBatch(size);
  }
}

runBatch(300)


// RESULT
// 20  NB 82.2 KNN 90.9
// 40  NB 87.5 KNN 93.4
// 60  NB 88.9 KNN 95.1
// 80  NB 90.1 KNN 95.1
// 100 NB 90.5 KNN 95.5
// 120 NB 91 KNN 95.9
// 140 NB 91.3 KNN 96.1
// 200 NB 91.5 KNN 96.5
// 300 NB 91.4 KNN 96.9

