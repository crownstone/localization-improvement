import {Collective} from "../dataContainers/Collective";
import {NaiveBayesian} from "../runners/node/NaiveBayesian";
import {NaiveBayesianGaussianMixture} from "../runners/node/NaiveBayesianGaussianMixture";
import {KNN} from "../runners/node/KNN";
import {FileUtil} from "../util/FileUtil";
import {FingerprintGenerator} from "../dataContainers/FingerprintGenerator";
import {TestSet} from "../dataContainers/TestSet";
import {plot} from "nodeplotlib";
import {LSH} from "../runners/node/LSH";

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


async function runNaiveBayesian() {
  let collective = new Collective()
  collective.loadTestSetMap(processingMap);
  await collective.runSetsCustomClassifier(new NaiveBayesian());
  collective.plotSummary()
};


async function runKNN() {
  let collective = new Collective()
  collective.loadTestSetMap(processingMap);
  await collective.runSetsCustomClassifier(new KNN());
  collective.plotSummary()
};

async function runLSH() {
  let collective = new Collective()
  collective.loadTestSetMap(processingMap);
  await collective.runSetsCustomClassifier(new LSH());
  collective.plotSummary()
};

async function run_generatedFingerprint(classifier, size) {
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

  let collective = new Collective()
  collective.loadSet(testSet);
  await collective.runSetsCustomClassifier(classifier);
  collective.plotSummary()
};

async function run_generatedFingerprint_native(size) {
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

  let collective = new Collective()
  collective.loadSet(testSet);
  await collective.runSets(true);
  collective.plotSummary()
};


async function runSet() {
  await run_generatedFingerprint(new KNN, 150);
  await run_generatedFingerprint(new NaiveBayesian(), 150);
  // await run_generatedFingerprint_native(150);
  // await runKNN();
}

runSet()

