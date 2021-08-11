import fs from "fs";
import path from "path";
import {TMP_DATASET_PATH, TMP_OUTPUT_PATH_BASE, USER_PATH} from "../config";
import {UserData} from "../dataContainers/User";

export const FileUtil = {

  store: function(filePath : string, data: any, options = {encoding:'utf8'}) {
    let dirname = path.dirname(TMP_DATASET_PATH);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname)
    }
    let str = typeof data === 'string' ? data : JSON.stringify(data);
    fs.writeFileSync(filePath, str, options);
  },


  readJSON: function<T>(filePath : string) : T {
    let data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T
  },

  getOutputPath: function(datasetPath: string, annotation? : string) {
    let basename = path.basename(datasetPath);
    if (annotation) {
      return TMP_OUTPUT_PATH_BASE + "output_" + annotation + "_" + basename
    }
    return TMP_OUTPUT_PATH_BASE + "output_" + basename
  },

  getUsers: function() : {[userName: string] : UserData } {
    let items = FileUtil.getDirectoryPaths(USER_PATH)
    let result : {[userName: string] : UserData } = {}
    for (let item of items) {
      let data = new UserData(item);
      result[data.name] = data;
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
  },

  deleteFile: function(path) {
    fs.unlinkSync(path);
  },

  renameFile: function(oldPath, newPath) {
    fs.renameSync(oldPath, newPath);
  },

  ensurePath(pathToEnsure) {
    if (fs.existsSync(pathToEnsure) && fs.statSync(pathToEnsure).isDirectory() === true) {
      return true;
    }
    else {
      fs.mkdirSync(pathToEnsure);
    }
  },

  ensureDatapath(userName, scenarioName) {
    let userPath = path.join(USER_PATH, userName);
    let scenarioPath = path.join(userPath, scenarioName);
    let fingerprintPath = path.join(scenarioPath, 'fingerprints');
    FileUtil.ensurePath(userPath);
    FileUtil.ensurePath(scenarioPath);
    FileUtil.ensurePath(fingerprintPath);
  }
}
