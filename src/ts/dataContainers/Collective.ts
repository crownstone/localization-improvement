import {FileUtil} from "../util/FileUtil";
import {TestSet} from "./TestSet";
import {OutputDataAggregator} from "./OutputDataAggregator";
import {plot} from "nodeplotlib";
import {UserData} from "./UserData";

export class Collective {

  testSets: TestSet[] = [];

  aggregatedResult : OutputDataAggregator;

  constructor() {
    this.aggregatedResult = new OutputDataAggregator({});
  }

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

      for (let set of scenario.sets) {
        this.testSets.push(set);
      }
    }
  }

  loadUser(userName: string) {
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

  async runSets() {
    for (let set of this.testSets) {
      await set.runAll();
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

}


