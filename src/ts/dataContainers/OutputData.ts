import {FileUtil} from "../util/FileUtil";

export class OutputData {

  path : string = null;
  data : LibOutputDataset;

  results = {
    NaiveBayesian: {hit: 0, miss:0, rate: 0, count: 0},
    kNN:           {hit: 0, miss:0, rate: 0, count: 0},
  };

  constructor(path: string) {
    this.path = path;
  }

  loadData() {
    this.data = FileUtil.readJSON<LibOutputDataset>(this.path);
  }

  process() {
    if (this.data === undefined) {
      this.loadData();
    }

    let nb = this.data.NaiveBayesian;
    for (let result of nb) {
      if (result.result === result.expectedLabel) {
        this.results.NaiveBayesian.hit++;
      }
      else {
        this.results.NaiveBayesian.miss++;
      }
      this.results.NaiveBayesian.count++;
    }

    this.results.NaiveBayesian.rate = this.results.NaiveBayesian.hit/ this.results.NaiveBayesian.count;
  }



}