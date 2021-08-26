import {SIMULATION_CONFIG} from "../config";
import {Collective} from "../dataContainers/Collective";
import {FileUtil} from "../util/FileUtil";



async function run() {
  console.log("Rerunning sets with fingerprint upper threshold", SIMULATION_CONFIG.fingerprints.rssiUpperThreshold);
  let collective = new Collective()
  collective.loadAllUsersFromDisk();
  await collective.runSets();
  collective.plotSummary();
};

async function runPerUser() {
  let users = FileUtil.getUsers()
  for (let user in users) {
    console.log("run per user", user, SIMULATION_CONFIG.fingerprints.rssiUpperThreshold)
    let collective = new Collective()
    collective.loadUser(user);
    await collective.runSets();
    collective.plotSummary();
  }
}

async function runSet() {
  SIMULATION_CONFIG.datasets.rssiUpperThreshold = -85;
  // SIMULATION_CONFIG.fingerprints.rssiUpperThreshold = -100;
  // await run();

  SIMULATION_CONFIG.fingerprints.rssiUpperThreshold = -85;
  await run();

  // SIMULATION_CONFIG.fingerprints.rssiUpperThreshold = -75;
  // await run();
}



runSet()

