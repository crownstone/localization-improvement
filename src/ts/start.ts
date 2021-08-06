#!/usr/bin/env node

import {FileUtil} from "./util/FileUtil";

async function asyncFunction() {
  let user = FileUtil.getUsers()[0];
  for (let scenario of user.scenarios) {
    await scenario.run()
  }
}

asyncFunction()
