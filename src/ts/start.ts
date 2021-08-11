#!/usr/bin/env node

import {FileUtil} from "./util/FileUtil";
import {Runner} from "./runners/Runner";
import {OutputData} from "./dataContainers/OutputData";


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
        for (let dataset of scenario.datasets) {
          console.log("------ Processing dataset", dataset.name);
          let runner = new Runner(fingerprint, dataset)
          let result = await runner.start();
          let outputData = new OutputData(result[0])
          outputData.process();
          console.log(`-------- NaiveBayesian success rate ${(outputData.results.NaiveBayesian.rate*100).toFixed(2)}% out of ${outputData.results.NaiveBayesian.count} samples.`)
        }
      }
    }
  }
}

run()

