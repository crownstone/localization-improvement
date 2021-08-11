import {FingerprintSet, FingerprintsBase} from "./Fingerprint";
import {Dataset} from "./Dataset";
import path from "path";
import {Runner} from "../runners/Runner";
import {FileUtil} from "../util/FileUtil";

export class Scenario {

  name         : string;
  fingerprints : FingerprintsBase[] = [];
  datasets     : Dataset[]     = [];
  outputPaths  : string[]      = [];
  constructor(scenarioPath: string) {
    this.name = path.basename(scenarioPath);

    let fingerprintFiles = FileUtil.getJSONFilePaths(path.join(scenarioPath, 'fingerprints'));
    let datasetFiles = FileUtil.getJSONFilePaths(scenarioPath);

    for (let fingerprintPath of fingerprintFiles) {
      this.fingerprints.push(new FingerprintSet(fingerprintPath));
    }

    for (let datasetPath of datasetFiles) {
      this.datasets.push(new Dataset(datasetPath));
    }

    for (let dataset of this.datasets) {
      this.outputPaths.push(dataset.getOutputPath())
    }
  }

  async run() : Promise<string[]> {
    let fingerprintIndex = 0;
    let outputPaths = [];
    for (let fingerprint of this.fingerprints) {
      let runner = new Runner(fingerprint, this.datasets, `${fingerprintIndex++}_`);
      let paths = await runner.start();
      outputPaths = outputPaths.concat(paths)
    }
    return outputPaths
  }
}