#!/usr/bin/env node

import {Collective} from "./dataContainers/Collective";


async function run() {
  let collective = new Collective()
  collective.loadAllUsersFromDisk();
  await collective.runSets();
  collective.plotConfusionMatrices();
}

run()

