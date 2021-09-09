import {Fingerprint} from "../dataContainers/Fingerprint";
import {Dataset} from "../dataContainers/Dataset";
import {FileUtil} from "../util/FileUtil";
import {runIOS} from "./iOS";

export class Runner {

  fingerprintRef  : Fingerprint;
  datasetRefArray : Dataset[] = [];
  outputPathAnnotation : string;

  constructor(fingerprint: Fingerprint, dataset: Dataset | Dataset[], outputPathAnnotation?: string) {
    this.fingerprintRef = fingerprint;
    if (Array.isArray(dataset)) {
      this.datasetRefArray = dataset;
    }
    else {
      this.datasetRefArray.push(dataset);
    }
    this.outputPathAnnotation = outputPathAnnotation;
  }

  async start(overwrite: boolean = false, silent = false) : Promise<string[]> {
    let outputPaths = [];
    this.fingerprintRef.writeToTempFile()
    for (let dataset of this.datasetRefArray) {
      // RUN IOS CLASSIFIER
      let outputPath = dataset.getOutputPath('ios', this.outputPathAnnotation);
      outputPaths.push(outputPath);

      let alreadyExists = FileUtil.fileExists(outputPath);
      if (!alreadyExists || overwrite === true) {
        dataset.writeToTempFile();
        let start = Date.now();
        console.log("Running iOS classifier with", this.fingerprintRef.name, "and", dataset.name, `(${dataset._data.dataset.length} points)`);
        await runIOS(outputPath, silent);
        if (!silent) { console.log("Completed. Took", (0.001*(Date.now() - start)).toFixed(3),'seconds.'); }
      }
      else {
        if (!silent) { console.log("Skipping iOS classifier with", this.fingerprintRef.name, "and", dataset.name, "because: Already classified and overwrite is false"); }
      }
    }
    return outputPaths;
  }

}
