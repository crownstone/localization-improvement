import {runIOS} from "./iOS";
import {Dataset} from "../util/Dataset";
import {FingerprintBase} from "../util/Fingerprint";

export class Runner {

  fingerprintRef  : FingerprintBase;
  datasetRefArray : Dataset[] = [];
  outputPathAnnotation = ''

  constructor(fingerprint: FingerprintBase, dataset: Dataset | Dataset[], outputPathAnnotation: string = '0') {
    this.fingerprintRef = fingerprint;
    if (Array.isArray(dataset)) {
      this.datasetRefArray = dataset;
    }
    else {
      this.datasetRefArray.push(dataset);
    }
    this.outputPathAnnotation = outputPathAnnotation;
  }

  async start() : Promise<string[]> {
    let outputPaths = [];
    this.fingerprintRef.writeToTempFile()
    for (let dataset of this.datasetRefArray) {
      dataset.writeToTempFile();
      let outputPath = this.outputPathAnnotation + dataset.getOutputPath();
      outputPaths.push(outputPath);
      await runIOS(outputPath);
    }
    return outputPaths;
  }

}
