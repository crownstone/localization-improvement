#!/usr/bin/env node

import {FileUtil} from "./util/FileUtil";


async function plotFingerprint() {
  let sets = FileUtil.getFingerprints();
  let fingerprint = sets[0].plotSummary()
}

plotFingerprint()
// run()

