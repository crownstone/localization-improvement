import path from "path";
import {FileUtil} from "../util/FileUtil";
import {Util} from "../util/Util";

export const LocalizationDataUtil = {

  getFilePath: function(data: RtcLocalizationFileTransfer) {
    let filePath;
    if (LocalizationDataUtil.isFingerprint(data)) {
      filePath = LocalizationDataUtil.getFingerprintFilePath(data);
    }
    else {
      filePath = LocalizationDataUtil.getDatasetFilePath(data);
    }

    LocalizationDataUtil.ensureDataPath(data);

    return filePath;
  },

  getActiveScenario: function(user) {
    let users = FileUtil.getUsers();
    if (users[user]) {
      return users[user].activeScenario;
    }
    else {
      return 'homeV1';
    }
  },

  ensureDataPath: function(data: RtcLocalizationFileTransfer) {
    let user = data.metadata.user.replace(/ /g,"_");
    let scenario = LocalizationDataUtil.getActiveScenario(user);
    FileUtil.ensureDatapath(user, scenario)
  },

  getDatasetDirPath: function(data: RtcLocalizationFileTransfer) : string {
    let user = data.metadata.user.replace(/ /g,"_");
    let scenario = LocalizationDataUtil.getActiveScenario(user);
    return path.join(__dirname, '../../../datasets/users', user, scenario);
  },

  getFingerprintDirPath: function(data: RtcLocalizationFileTransfer) : string {
    return path.join(LocalizationDataUtil.getDatasetDirPath(data), 'fingerprints');
  },

  getFingerprintFilePath: function(data: RtcLocalizationFileTransfer) : string {
    return path.join(LocalizationDataUtil.getFingerprintDirPath(data), `${data.fileName.replace(/:/g,"_")}.tmp`);
  },

  getDatasetFilePath: function(data: RtcLocalizationFileTransfer) : string {
    return path.join(LocalizationDataUtil.getDatasetDirPath(data), data.fileName.replace(/:/g,"_"));
  },

  isFingerprint: function(data : RtcLocalizationFileTransfer) : boolean {
    return data.fileName.indexOf("Fingerprints") !== -1
  },

  compareAndStoreFingerprint: function(tmpPath: string, data: RtcLocalizationFileTransfer) {
    let newFingerprint = FileUtil.readJSON(tmpPath);
    let fingerprintPath = LocalizationDataUtil.getFingerprintDirPath(data);
    let existingFingerprints = FileUtil.getJSONFilePaths(fingerprintPath);

    let count = 1;
    for (let item of existingFingerprints) {
      let fingerprint = FileUtil.readJSON(item);
      if (Util.deepCompare(newFingerprint, fingerprint)) {
        // delete tmp
        console.log("Already have this fingerprint, removing tmp file.")
        FileUtil.deleteFile(tmpPath);
        return;
      }
      else {
        count++;
      }
    }

    // rename temp to `fingerprint.v${count}.json`
    console.log("Storing new fingerprint as", `fingerprint.v${count}.json`)
    FileUtil.renameFile(tmpPath, path.join(fingerprintPath,`fingerprint.v${count}.json`));
  }
}

