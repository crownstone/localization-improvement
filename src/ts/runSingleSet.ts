#!/usr/bin/env node

import {FileUtil} from "./util/FileUtil";
import {plot} from "nodeplotlib";


async function run() {
  let users = FileUtil.getUsers();
  let set = users["Alex_de_Mulder"].scenarios['homeV1'].sets[0];
  let result = await set.run(set.datasets[0])
  set.aggregatedResult.add(result)
  console.log(set.aggregatedResult.plotConfusionMatrix('58de6bda62a2241400f10c67'))
  plot()
}

run()

