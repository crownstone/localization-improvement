import {FileUtil} from "../util/FileUtil";
import {TestSet} from "./TestSet";
import {OutputDataAggregator} from "./OutputDataAggregator";
import {plot} from "nodeplotlib";
import {UserData} from "./UserData";

interface ProcessingMap {
  [userName: string] : boolean | {
    [scenarioName: string] : boolean | {
      [fingerprintName: string] : boolean | {
        [datasetName: string] : boolean
      }
    }
  }
}

export class Collective {

  testSets: TestSet[] = [];

  aggregatedResult : OutputDataAggregator;

  constructor() {
    this.aggregatedResult = new OutputDataAggregator({});
  }

  /**
   * This generates a map that you can use as input for the loadMap method. It allows you to easily run an experiment on a subset of the available data.
   */
  printProcessingMap() {
    let result : ProcessingMap = {};
    let users = FileUtil.getUsers();

    for (let userName in users) {
      let user = users[userName];
      result[userName] = {}
      for (let scenarioName in user.scenarios) {
        let scenario = user.scenarios[scenarioName];
        result[userName][scenarioName] = {};
        for (let fingerprintName in scenario.sets) {
          result[userName][scenarioName][fingerprintName] = {};

          let testSet = scenario.sets[fingerprintName];
          for (let dataset of testSet.datasets) {
            result[userName][scenarioName][fingerprintName][dataset.name] = true;
          }
        }
      }
    }

    console.log(JSON.stringify(result, undefined, 2));
  }


  /**
   * Tell the collective to only load testfiles based on the users/fingerprints/datasets you want to use in this experiment.
   * @param map
   */
  loadMap(map: ProcessingMap) {
    let users = FileUtil.getUsers();
    for (let userName in map) {
      let userMapEntry = map[userName];
      if (userMapEntry === true) {
        this.loadUser(userName);
        continue;
      }
      else if (userMapEntry === false) {
        continue;
      }

      let user = users[userName];
      for (let scenarioName in userMapEntry) {
        let scenarioMapEntry = userMapEntry[scenarioName];
        if (scenarioMapEntry === true) {
          for (let set of Object.values(user.scenarios[scenarioName]?.sets || {})) {
            this.testSets.push(set);
          }
          continue;
        }
        else if (scenarioMapEntry === false) {
          continue;
        }

        let scenario = user.scenarios[scenarioName];
        for (let fingerprintName in scenarioMapEntry) {
          let fingerprintMapEntry = scenarioMapEntry[fingerprintName];
          if (fingerprintMapEntry === true) {
            if (scenario?.sets[fingerprintName]) {
              this.testSets.push(scenario.sets[fingerprintName]);
            }
            continue;
          }
          else if (fingerprintMapEntry === false) {
            continue;
          }

          let testSet = scenario?.sets[fingerprintName];
          if (!testSet) {
            continue;
          }

          // construct new testSet that includes the selected datasets
          let customTestSet = new TestSet()
          let items = [];
          for (let datasetName in fingerprintMapEntry) {
            let datasetItem = fingerprintMapEntry[datasetName];
            if (datasetItem === true) {
              for (let dataset of testSet.datasets) {
                if (dataset.name === datasetName) {
                  items.push(dataset);
                  break;
                }
              }
            }
          }
          if (items.length > 0) {
            customTestSet.loadDatasets(items);
            customTestSet.loadFingerprint(testSet.fingerprint);
            customTestSet.scenarioName = scenarioName;
            customTestSet.userName = userName;
            this.testSets.push(customTestSet);
          }
        }
      }
    }
  }


  /**
   * This simply loads all data into the collective.
   */
  loadAllUsersFromDisk() {
    let users = FileUtil.getUsers();
    for (let username in users) {
      let user = users[username];
      this._loadUserSets(user);
    }
  }

  _loadUserSets(user: UserData) {
    for (let scenarioName in user.scenarios) {
      let scenario = user.scenarios[scenarioName];

      for (let set of Object.values(scenario.sets)) {
        this.testSets.push(set);
      }
    }
  }

  loadUser(userName: string) {
    userName = userName.replace(/ /g,"_");
    let users = FileUtil.getUsers();
    if (users[userName] === undefined) { throw new Error("User not found on disk") };

    this._loadUserSets(users[userName]);
  }

  loadSet(testSet: TestSet | TestSet[]) {
    if (Array.isArray(testSet)) {
      for (let set of testSet) {
        this.testSets.push(set);
      }
    }
    else {
      return this.testSets.push(testSet);
    }
  }

  async runSets(overwrite = false) {
    for (let set of this.testSets) {
      await set.runAll(overwrite);
      this.aggregatedResult.merge(set.aggregatedResult);
    }
  }

  plotConfusionMatrices() {
    // this gets all the sphereIds from all fingerprints in all the testSets
    let sphereIds = Object.keys(this.aggregatedResult.locationNameMap);
    for (let sphereId of sphereIds) {
      let hasDatapoints = this.aggregatedResult.plotConfusionMatrix(sphereId);
      if (hasDatapoints) {
        plot();
      }
    }
  }

  plotSummary() {
    let sphereIds = Object.keys(this.aggregatedResult.locationNameMap);
    for (let sphereId of sphereIds) {
      this.aggregatedResult.plotTotalSuccessRate(sphereId);
      this.aggregatedResult.plotSuccessRate(sphereId);
      let hasDatapoints = this.aggregatedResult.plotConfusionMatrix(sphereId);
      if (hasDatapoints) {
        this.aggregatedResult.printTotalSuccessRate(sphereId);
        plot();
      }
    }
  }

}


