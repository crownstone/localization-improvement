import {runIOS} from "./iOS";
import {FileUtil} from "../util/FileUtil";
import {DataMapper} from "../util/DataMappers";
import {TMP_DATASET_PATH} from "../paths/paths";


export async function classifyDatasets(fingerprintPath : string, datasetPaths:string[]) : Promise<string[]> {
  let outputPaths : string[] = [];

  for (let datasetPath of datasetPaths) {
    const dataset           = FileUtil.readJSON<AppDatasetFormat>(datasetPath)
    const formattedDataset  = DataMapper.AppDatasetToLibs(dataset);
    FileUtil.store(TMP_DATASET_PATH, formattedDataset);

    let outputPath = FileUtil.getOutputPath(datasetPath);
    await runIOS(outputPath)
    outputPaths.push(outputPath);
  }

  return outputPaths
}