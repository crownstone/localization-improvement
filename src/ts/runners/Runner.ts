import {runIOS} from "./iOS";
import {FingerprintsBase} from "../dataContainers/Fingerprint";
import {Dataset} from "../dataContainers/Dataset";

export class Runner {

  fingerprintRef  : FingerprintsBase;
  datasetRefArray : Dataset[] = [];
  outputPathAnnotation : string;

  constructor(fingerprint: FingerprintsBase, dataset: Dataset | Dataset[], outputPathAnnotation?: string) {
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
      let outputPath = dataset.getOutputPath(this.outputPathAnnotation);
      outputPaths.push(outputPath);
      await runIOS(outputPath);
    }
    return outputPaths;
  }

}
