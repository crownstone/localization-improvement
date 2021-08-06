import {DataMapper} from "./DataMappers";
import {TMP_DATASET_PATH} from "../paths/paths";
import {FileUtil} from "./FileUtil";
import path from "path";

export class Dataset {

  name : string = null;
  path : string = null;
  data : AppDatasetFormat;

  constructor(datasetPath: string | null = null) {
    if (datasetPath) {
      this.name = path.basename(datasetPath);
      this.path = datasetPath;
    }
  }

  getAppData() : AppDatasetFormat {
    if (this.data) { return this.data; }
    this.data = FileUtil.readJSON<AppDatasetFormat>(this.path);
    return this.data;
  }

  getLibData() : DatasetFileLibFormat {
    return DataMapper.AppDatasetToLibs(this.getAppData());
  }

  writeToTempFile(tmpFilePath = TMP_DATASET_PATH) {
    FileUtil.store(tmpFilePath, this.getLibData());
  }

  getOutputPath() : string {
    return FileUtil.getOutputPath(this.path);
  }

  getRandomSample(sphereId: string, locationId: string) : FingerprintDatapoint {
    let data = this.getAppData();
    let samples = data.dataset;
    let index = Math.floor(Math.random()*samples.length);
    return samples[index];
  }
}