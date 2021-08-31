#!/usr/bin/env node

import {Collective} from "../dataContainers/Collective";
import {DataMapper} from "../util/DataMappers";

let collective = new Collective()
collective.loadUser("Alex_de_Mulder");
let set = collective.testSets[0]

set.generateWekaFiles()

// DataMapper.DatasetToWeka(dataset,fingerprint)