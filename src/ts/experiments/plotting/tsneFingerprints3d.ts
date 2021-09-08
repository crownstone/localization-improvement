import {Collective} from "../../dataContainers/Collective";
import {tSNE} from "../../logic/tsne";
import {Plot, plot} from "nodeplotlib";
import {Mixer} from "../../util/colorCharm/Mixer";


let processingMap = {
  "Alex_de_Mulder": {
    "homeV1": {
      "fingerprint.v1.json": true
    }
  },
}


// SIMULATION_CONFIG.fingerprints.rssiUpperThreshold = -85

// SIMULATION_CONFIG.conversion.rssiToDistance = true;
// SIMULATION_CONFIG.conversion.minDistanceMeters = 0.5;
// SIMULATION_CONFIG.conversion.maxDistanceMeters = 10;


let collective = new Collective()
collective.loadTestSetMap(processingMap);
let fingerprint = collective.testSets[0].fingerprint;
fingerprint.getAppData()

// only look at 1 sphere
let sphereData = fingerprint._data.spheres['58de6bda62a2241400f10c67'];
let allCrownstones = {};


for (let locationId in sphereData.fingerprints) {
  let fingerprint = sphereData.fingerprints[locationId].fingerprint;

  for (let point of fingerprint) {
    for (let deviceId in point.devices) {
      allCrownstones[deviceId] = true;
    }
  }
}

const NO_DATA = 1e5;
let data = [];
let labelArray = [];
let labelMap = {};

for (let locationId in sphereData.fingerprints) {
  let fingerprint = sphereData.fingerprints[locationId].fingerprint;
  for (let point of fingerprint) {
    let dataArray = [];
    for (let deviceId in allCrownstones) {
      dataArray.push(point.devices[deviceId] ?? NO_DATA);
    }
    labelArray.push(`${locationId}:${sphereData.fingerprints[locationId].name}`);
    labelMap[`${locationId}:${sphereData.fingerprints[locationId].name}`] = true
    data.push(dataArray);
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


let tsneFingerprints = new tSNE({dimension:3});

tsneFingerprints.initDataRaw(data);

let layout = {
  width: 1000,
  height: 1000,
}

function plotIt() {
  let Y = tsneFingerprints.getSolution(); // Y is an array of 2-D points that you can plot
  let traces : Plot[] = [];
  let x = [];
  let y = [];
  let z = [];
  let colorIndex = 0
  let currentLabel = labelArray[0]

  function draw(i) {
    if (labelArray[i] !== currentLabel) {
      traces.push({
        x, y, z, name: currentLabel, mode: 'markers',
        marker:{
          color: colors[colorIndex%labelCount],
          // line: {
          //   color: 'rgba(217, 217, 217, 0.14)',
          //   width: 0.5
          // },
          opacity: 0.8,
          // symbol: colorIndex % 2 === 0 ? "x" : "."
        },
        type: "scatter3d"
      });
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
    z.push(Y[i][2])
  }
  draw(0)


  plot(traces, layout)
}


for(let i = 0; i < 2000; i++) {
  tsneFingerprints.step(); // every time you call this, solution gets better
  if (i % 25 == 0) {
    console.log("Iter: ", i)
  }
}
plotIt()
console.log('done')
