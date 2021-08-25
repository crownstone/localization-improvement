#!/usr/bin/env node

import {FileUtil} from "./util/FileUtil";

async function run() {
  let users = FileUtil.getUsers();
  let set = users["Alex_de_Mulder"].scenarios['homeV1'].sets[0];
  for (let ds of set.datasets) {
    let result = await set.run(ds)
    result.plotSummary()
  }
}

run()

