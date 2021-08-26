#!/usr/bin/env node

import {FileUtil} from "../util/FileUtil";
import {plot} from "nodeplotlib";
import {Collective} from "../dataContainers/Collective";


async function run() {
  let collective = new Collective()
  collective.loadUser("test_tel3");
  await collective.runSets();
  collective.plotSummary();
}

run()

