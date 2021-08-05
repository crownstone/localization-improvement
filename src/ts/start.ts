#!/usr/bin/env node

import {classifyDatasets} from "./runners/Runner";

const fingerprintPath      = `${__dirname}/../../datasets/alex/Fingerprints.json`
const datasetPath          = `${__dirname}/../../datasets/alex/Localization-Dataset-Studeerkamer-1-2021-08-03 17_13_41.json`

async function asyncRunner() {
  let outputPaths = await classifyDatasets(fingerprintPath, [datasetPath]);

  console.log("Resulting", outputPaths)
}

asyncRunner();