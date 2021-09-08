import path from "path";
import {FileUtil} from "../util/FileUtil";
import {TestSet} from "./TestSet";
import {Dataset} from "./Dataset";

export class Scenario {

  userName     : string;

  name         : string;
  path         : string;
  testSets     : {[fingerprintName: string]: TestSet} = {};
  datasets     : Dataset[] = []

  constructor(scenarioPath: string, userName: string = "UNKNOWN") {
    this.userName = userName;
    this.name = path.basename(scenarioPath);
    this.path = scenarioPath;

    let fingerprintFiles = FileUtil.getJSONFilePaths(path.join(scenarioPath, 'fingerprints'));

    for (let fingerprintPath of fingerprintFiles) {
      let set = new TestSet(scenarioPath, fingerprintPath, this.name, this.userName);
      this.testSets[set.fingerprint.name] = set;
    }

    let datasetFiles = FileUtil.getJSONFilePaths(scenarioPath);

    for (let datasetPath of datasetFiles) {
      let dataset = new Dataset(datasetPath);
      this.datasets.push(dataset);
    }
  }

  getTestSet(fingerprintName: string) : TestSet {
    if (this.testSets[fingerprintName]) {
      return this.testSets[fingerprintName];
    }

    throw new Error("Fingerprint not found.");
  }
}
