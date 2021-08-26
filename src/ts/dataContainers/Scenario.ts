import path from "path";
import {FileUtil} from "../util/FileUtil";
import {TestSet} from "./TestSet";

export class Scenario {

  userName     : string;

  name         : string;
  path         : string;
  sets         : {[fingerprintName: string]: TestSet} = {};

  constructor(scenarioPath: string, userName: string = "UNKNOWN") {
    this.userName = userName;
    this.name = path.basename(scenarioPath);
    this.path = scenarioPath;

    let fingerprintFiles = FileUtil.getJSONFilePaths(path.join(scenarioPath, 'fingerprints'));

    for (let fingerprintPath of fingerprintFiles) {
      let set = new TestSet(scenarioPath, fingerprintPath, this.name, this.userName);
      this.sets[set.fingerprint.name] = set;
    }
  }

  getSet(fingerprintName: string) : TestSet {
    if (this.sets[fingerprintName]) {
      return this.sets[fingerprintName];
    }

    throw new Error("Fingerprint not found.");
  }
}
