import fs from "fs";
import path from "path";
import {TMP_OUTPUT_PATH_BASE, USER_PATH} from "../paths/paths";
import {Dataset} from "./Dataset";
import {Fingerprint} from "./Fingerprint";
import {Runner} from "../runners/Runner";

export const FileUtil = {

  store: function(filePath : string, data: any) {
    let str = typeof data === 'string' ? data : JSON.stringify(data)
    fs.writeFileSync(filePath, str);
  },

  readJSON: function<T>(filePath : string) : T {
    let data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T
  },

  getOutputPath: function(datasetPath: string) {
    let basename = path.basename(datasetPath);
    return TMP_OUTPUT_PATH_BASE + "output_" + basename
  },

  getUsers: function() : UserData[] {
    let items = FileUtil.getDirectoryPaths(USER_PATH)
    let result : UserData[] = [];
    for (let item of items) {
      result.push(new UserData(item))
    }
    return result;
  },

  getDirectories: function(inPath) : string[] {
    let items =  fs.readdirSync(inPath);
    let result : string[] = [];
    for (let item of items) {
      let usedPath = path.join(inPath, item)
      if (fs.statSync(usedPath).isDirectory()) {
        result.push(item)
      }
    }
    return result;
  },

  getJSONFilePaths: function(inPath) : string[] {
    let items =  fs.readdirSync(inPath);
    let result : string[] = [];
    for (let item of items) {
      let usedPath = path.join(inPath, item)
      if (fs.statSync(usedPath).isDirectory() === false && path.extname(usedPath) === '.json') {
        result.push(usedPath)
      }
    }
    return result;
  },

  getDirectoryPaths: function(inPath) : string[] {
    let items = FileUtil.getDirectories(inPath);
    let result : string[] = [];
    for (let item of items) {
      let usedPath = path.join(inPath, item)
      result.push(usedPath)
    }
    return result;
  }
}

export class UserData {

  name: string;
  scenarios : ScenarioData[] = [];

  constructor(userPath: string) {
    this.name = path.basename(userPath);
    let scenarioPaths = FileUtil.getDirectoryPaths(userPath);
    for (let scenarioPath of scenarioPaths) {
      this.scenarios.push(new ScenarioData(scenarioPath))
    }
  }
}

export class ScenarioData {

  name         : string;
  fingerprints : Fingerprint[] = [];
  datasets     : Dataset[]     = [];
  outputPaths  : string[]      = [];
  constructor(scenarioPath: string) {
    this.name = path.basename(scenarioPath);

    let fingerprintFiles = FileUtil.getJSONFilePaths(path.join(scenarioPath, 'fingerprints'));
    let datasetFiles = FileUtil.getJSONFilePaths(scenarioPath);

    for (let fingerprintPath of fingerprintFiles) {
      this.fingerprints.push(new Fingerprint(fingerprintPath));
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

