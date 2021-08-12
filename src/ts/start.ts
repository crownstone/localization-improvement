#!/usr/bin/env node

import {FileUtil} from "./util/FileUtil";
import {Runner} from "./runners/Runner";
import {DataAggregator, OutputData} from "./dataContainers/OutputData";


let agg = new DataAggregator();

async function run() {
  console.log("Scanning for users...")
  let users = FileUtil.getUsers();
  for (let username in users) {
    console.log("Running", username);
    let user = users[username];
    for (let scenarioName in user.scenarios) {
      console.log("-- Running scenario", scenarioName, 'for', username);
      let scenario = user.scenarios[scenarioName];
      let counter = 1;
      for (let fingerprint of scenario.fingerprints) {
        console.log("---- Running fingerprint set #", counter++);
        let locationNameMap = fingerprint.getLocationNameMap();
        for (let dataset of scenario.datasets) {
          console.log("------ Processing dataset", dataset.name);
          let runner = new Runner(fingerprint, dataset)
          let result = await runner.start();
          let outputData = new OutputData(result[0], locationNameMap)
          agg.add(outputData);

          // outputData.plot()
          console.log(`-------- naiveBayesian success rate ${outputData.naiveBayesian.percentage} out of ${outputData.naiveBayesian.count} samples.`)
          console.log(`-------- kNN           success rate ${outputData.kNN.percentage} out of ${outputData.kNN.count} samples.`)
          // return;
        }
      }
    }
  }
  agg.plot()
}

run()

