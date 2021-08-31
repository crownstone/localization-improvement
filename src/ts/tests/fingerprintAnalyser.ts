#!/usr/bin/env node

import {FileUtil} from "../util/FileUtil";


async function plotFingerprint() {
  let sets = FileUtil.getFingerprints();
  let fingerprint = sets[0];
  // fingerprint.compareLocations('58de6bda62a2241400f10c67',16,5, 800, 500);
  fingerprint.plotSummary()
}

plotFingerprint()

