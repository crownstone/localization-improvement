import * as fs from "fs";
import * as path from "path";
import {TMP_OUTPUT_PATH_BASE} from "../paths/paths";

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
  }


}