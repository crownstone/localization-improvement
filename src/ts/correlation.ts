#!/usr/bin/env node

import {FileUtil} from "./util/FileUtil";
import {plot} from "nodeplotlib";


async function run() {
  console.log("Scanning for users...")
  let users = FileUtil.getUsers();
  let i = 0
  for (let username in users) {
    console.log("Running", username);
    let user = users[username];
    for (let scenarioName in user.scenarios) {
      console.log("-- Running scenario", scenarioName, 'for', username);
      let scenario = user.scenarios[scenarioName];
      for (let dataset of scenario.datasets) {
        i = i + 1
        console.log("------ Processing dataset", dataset.name);
        dataset.getDistanceReport(true)
        if (i%2 === 0) {
          plot()
        }
      }
    }
  }
}

run()

