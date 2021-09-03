import {TMP_DATASET_PATH, TMP_FINGERPRINT_PATH} from "../config";
import {run} from "./runnerUtil";
import path from "path";

const packagePath = path.join(__dirname,'/../../../ios');

export async function runIOS(outputPath, silent = false) : Promise<void> {
  return run(`swift run localization "${TMP_FINGERPRINT_PATH}" "${TMP_DATASET_PATH}" "${outputPath}" --package-path "${packagePath}"`, silent)
}