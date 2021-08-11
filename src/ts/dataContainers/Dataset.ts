import path from "path";
import {TMP_DATASET_PATH} from "../config";
import {FileUtil} from "../util/FileUtil";
import {DataMapper} from "../util/DataMappers";

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

  getOutputPath(annotation?: string) : string {
    return FileUtil.getOutputPath(this.path, annotation);
  }

  getRandomSample(sphereId: string, locationId: string) : FingerprintDatapoint {
    let data = this.getAppData();
    let samples = data.dataset;
    let index = Math.floor(Math.random()*samples.length);
    return samples[index];
  }
}