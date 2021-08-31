import {Collective} from "../../dataContainers/Collective";
import {tSNE} from "../../logic/tsne";
import {Plot, plot} from "nodeplotlib";
import {Mixer} from "../../util/colorCharm/Mixer";

const STEP_SIZE = 3
const ITERATIONS = 2000

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



let collective = new Collective()
collective.loadMap(processingMap);
let datasets = collective.testSets[0].datasets;

// only look at 1 sphere
let allCrownstones = {};

for (let dataset of datasets) {
  dataset.getAppData();
  for (let point of dataset._data.dataset) {
    for (let deviceId in point.devices) {
      allCrownstones[deviceId] = true;
    }
  }
}

const NO_DATA = 1e5;
let data = [];
let labelArray = [];
let labelMap = {};

for (let dataset of datasets) {
  let set = dataset._data.dataset;
  for (let i = 0; i < set.length; i++) {
    if (i % STEP_SIZE != 0) {
      continue
    }
    let point = set[i];
    let dataArray = [];
    for (let deviceId in allCrownstones) {
      dataArray.push(point.devices[deviceId] ?? NO_DATA);
    }
    labelArray.push(`${dataset.locationId}:${dataset.locationName}`);
    labelMap[`${dataset.locationId}:${dataset.locationName}`] = true
    data.push(dataArray)
  }
}

let labelCount = Math.min(20, Object.keys(labelMap).length);
let colorMixer = new Mixer()
let colors = colorMixer.linear(
  [[
    "#ff9100",
    "#7cfa00",
    "#00a7fd",
    "#fa0000",

  ]],
  labelCount, 'HCL'
).toHex()


console.log("Preprocessing Done")
console.log("Initializing", data.length, Object.keys(allCrownstones).length)
let tsneDatasets = new tSNE();

tsneDatasets.initDataRaw(data);

let layout = {
  width: 1000,
  height: 1000,
}

function plotIt() {
  let Y = tsneDatasets.getSolution(); // Y is an array of 2-D points that you can plot
  let traces : Plot[] = [];
  let x = []
  let y = [];
  let colorIndex = 0
  let currentLabel = labelArray[0]

  function draw(i) {
    if (labelArray[i] !== currentLabel) {
      traces.push({
        x, y, name: currentLabel, mode: 'markers',
        marker:{
          color: colors[colorIndex%labelCount], symbol: colorIndex % 2 === 0 ? "x" : "O"
        },type: "scatter"});
      x = [];
      y = [];
      currentLabel = labelArray[i]
      colorIndex++;
    }
  }
  for (let i = 0; i < Y.length; i++) {
    draw(i)
    x.push(Y[i][0])
    y.push(Y[i][1])
  }
  draw(0)


  plot(traces, layout)
}


console.log("STARTING", data.length, Object.keys(allCrownstones).length)

for(let i = 0; i < ITERATIONS; i++) {
  console.time(String(i))
  tsneDatasets.step(); // every time you call this, solution gets better
  console.timeEnd(String(i))

}
plotIt()
console.log('done')
