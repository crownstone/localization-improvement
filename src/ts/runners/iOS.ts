import {exec} from "child_process";
import {TMP_DATASET_PATH, TMP_FINGERPRINT_PATH} from "../paths/paths";

const packagePath = `${__dirname}/../../../ios`

export async function runIOS(outputPath) : Promise<void> {
  return new Promise((resolve, reject) => {
    const callback = function (error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
      }
      console.log('Child Process STDERR: '+stderr);
      console.log('Child Process STDOUT: '+stdout);
      resolve();
    };

    exec(`swift run localization "${TMP_FINGERPRINT_PATH}" "${TMP_DATASET_PATH}" "${outputPath}" --package-path "${packagePath}"`, callback);
  })
}