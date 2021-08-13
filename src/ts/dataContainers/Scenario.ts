import path from "path";
import {FileUtil} from "../util/FileUtil";
import {TestSet} from "./TestSet";

export class Scenario {

  name         : string;
  sets         : TestSet[] = []

  constructor(scenarioPath: string) {
    this.name = path.basename(scenarioPath);

    let fingerprintFiles = FileUtil.getJSONFilePaths(path.join(scenarioPath, 'fingerprints'));

    for (let fingerprintPath of fingerprintFiles) {
      this.sets.push(new TestSet(scenarioPath, fingerprintPath));
    }
  }

  getSet(fingerprintName: string) : TestSet {
    for (let set of this.sets) {
      if (set.name === fingerprintName) {
        return set;
      }
    }
    throw new Error("Fingerprint not found.");
  }
}
