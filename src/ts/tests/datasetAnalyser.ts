#!/usr/bin/env node

import {FileUtil} from "../util/FileUtil";
import {SIMULATION_CONFIG} from "../config";
import {plot} from "nodeplotlib";

// async function run() {
//   let userName     = "Alex_de_Mulder"
//   let scenarioName = "homeV1"
//   let fingerprint  = "fingerprint.v1.json"
//   let datasetName  = 'Localization_Dataset_Badkamer_9_2021-08-11 22:35:30.json'
//
//   let users = FileUtil.getUsers();
//
//   let user = users[userName]
//   let scenario = user.scenarios[scenarioName];
//   let output = await scenario.getSet(fingerprint).run(datasetName);
//
//   output.plotSummary();
// }

async function plotDatasets() {
  // SIMULATION_CONFIG.interpolation.datasets = true;
  // SIMULATION_CONFIG.interpolation.fingerprint = false;
  // SIMULATION_CONFIG.interpolation.require2points = false;
  // SIMULATION_CONFIG.interpolation.timespanSeconds = 5;
  let sets = FileUtil.getDatasets("Alex_de_Mulder");
  let i = 0
  for (let set of sets) {
    i++;
    if (i == 21) {
      set.plotRssiBarGraph()
      plot()
    }
  }
}

plotDatasets()
// run()

