#!/usr/bin/env node

import {FileUtil} from "./util/FileUtil";

async function run() {
  let userName     = "Alex_de_Mulder"
  let scenarioName = "homeV1"
  let fingerprint  = "fingerprint.v1.json"
  let datasetName  = 'Localization_Dataset_Badkamer_9_2021-08-11 22:35:30.json'

  let users = FileUtil.getUsers();

  let user = users[userName]
  let scenario = user.scenarios[scenarioName];
  let output = await scenario.getSet(fingerprint).run(datasetName);

  output.plotSummary();
}

run()

