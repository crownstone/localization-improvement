import fs from "fs";
import path from "path";
import {FileUtil} from "../util/FileUtil";
import {Scenario} from "./Scenario";

export class UserData {

  name: string;
  path: string;
  scenarios : {[scenarioName: string] : Scenario} = {}
  activeScenario : string;

  constructor(userPath: string) {
    this.path = userPath;
    this.name = path.basename(userPath);
    let scenarioPaths = FileUtil.getDirectoryPaths(userPath);
    for (let scenarioPath of scenarioPaths) {
      let data = new Scenario(scenarioPath);
      this.scenarios[data.name] = data;
    }

    this.getActiveScenario();
  }

  getActiveScenario() {
    let configPath = path.join(this.path, 'activeScenario.json')
    if (fs.existsSync(configPath)) {
      let data = FileUtil.readJSON<ScenarioConfig>(configPath);
      this.activeScenario = data.activeScenario;
    }
    else {
      if (Object.keys(this.scenarios).length > 0) {
        this.activeScenario = Object.keys(this.scenarios)[0];
        let data = {activeScenario: this.activeScenario };
        FileUtil.store(configPath, data);
      }
    }
  }
}


