// import {FileUtil} from "../util/FileUtil";
// import {Layout, plot, stack} from 'nodeplotlib';
// import {OutputDataContainer} from "./outputComponents/OutputDataContainer";
// import {Dataset} from "./Dataset";
// import {PLOT_DEFAULT_HEIGHT, PLOT_DEFAULT_WIDTH, PLOT_MARGINS} from "../config";
// import {Fingerprint} from "./Fingerprint";
//
// export class OutputData {
//
//   path : string = null;
//   locationNameMap: LocationNameMap;
//   _data : LibOutputDataset;
//
//   dataset: Dataset
//   fingerprint: Fingerprint
//
//   naiveBayesian : OutputDataContainer
//   kNN           : OutputDataContainer
//
//   constructor(path: string | null, dataset: Dataset, fingerprint: Fingerprint, locationNameMap: LocationNameMap) {
//     this.path = path;
//     this.locationNameMap = locationNameMap;
//     this.dataset = dataset;
//     this.fingerprint = fingerprint;
//
//     if (this.path) {
//       let data = FileUtil.readJSON<LibOutputDataset>(this.path);
//       this.setData(data);
//     }
//   }
//
//   setData(data) {
//     this.naiveBayesian = new OutputDataContainer(data.naiveBayesian, this.locationNameMap, 'naiveBayesian')
//     this.kNN           = new OutputDataContainer(data.kNN,           this.locationNameMap, 'kNN')
//   }
//
//   printSuccess() {
//     console.log(`-------- naiveBayesian success rate ${this.naiveBayesian.percentage} out of ${this.naiveBayesian.count} samples.`)
//     console.log(`-------- kNN           success rate ${this.kNN.percentage} out of ${this.kNN.count} samples.`)
//   }
//
//
//   plotSuccessRate(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
//     let data = [
//       this.naiveBayesian.getSuccessRate(),
//       this.kNN.getSuccessRate()
//     ]
//     let layout: Layout = {
//       title: "Successrate of " + this.dataset.name,
//       width: width,
//       height: height,
//       xaxis: {title: "Success percentage", range: [0, 100]},
//       ...PLOT_MARGINS,
//     }
//
//     stack(data, layout);
//   }
//
//
//   plotLocalizationBarGraph(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
//     let data = [
//       this.naiveBayesian.getClassificationBarTrace(),
//       this.kNN.getClassificationBarTrace()
//     ]
//     let layout : Layout = {
//       title: "Classification distribution",
//       width: width,
//       height: height,
//       xaxis:{title:"Room classified"},
//       yaxis:{title:"Number of classifications"},
//       ...PLOT_MARGINS,
//     }
//
//     stack(data, layout);
//   }
//
//   plotClassificationGraph(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
//     let data = [
//       this.naiveBayesian.getExpectedTrace(),
//       this.naiveBayesian.getClassificationLineTrace(),
//       this.kNN.getClassificationLineTrace(),
//     ];
//     let layout : Layout = {
//       title: "Classification over time",
//       width: width,
//       height: height,
//       xaxis:{title:"Samples"},
//       yaxis:{title:"Room classified"},
//       ...PLOT_MARGINS
//     }
//
//     stack(data, layout);
//   }
//
//   plotSummary(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
//     this.plotSuccessRate(            width, height);
//     this.plotLocalizationBarGraph(   width, height);
//     this.plotClassificationGraph(    width, height);
//     this.dataset.plotDistanceReport( width, height*1.75);
//     this.dataset.plotOffsetGraph(    width, height);
//     this.dataset.plotSampleSizeGraph(width, height);
//     plot();
//   }
// }


import {FileUtil} from "../util/FileUtil";
import {Layout, plot, stack} from 'nodeplotlib';
import {OutputDataContainer} from "./outputComponents/OutputDataContainer";
import {Dataset} from "./Dataset";
import {PLOT_DEFAULT_HEIGHT, PLOT_DEFAULT_WIDTH, PLOT_MARGINS} from "../config";
import {Fingerprint} from "./Fingerprint";

export class OutputData {

  path : string = null;
  locationNameMap: LocationNameMap;

  dataset: Dataset
  fingerprint: Fingerprint

  output : Record<string, OutputDataContainer> = {};

  constructor(path: string | null, dataset: Dataset, fingerprint: Fingerprint, locationNameMap: LocationNameMap) {
    this.path = path;
    this.locationNameMap = locationNameMap;
    this.dataset = dataset;
    this.fingerprint = fingerprint;

    if (this.path) {
      let data = FileUtil.readJSON<LibOutputDataset>(this.path);
      this.setData(data.naiveBayesian, 'naiveBayesian');
      this.setData(data.kNN, 'kNN');
    }
  }

  setData(data: ClassificationResults[], name: string) {
    this.output[name] = new OutputDataContainer(data, this.locationNameMap, name)
  }

  printSuccess() {
    for (let name in this.output) {
      console.log(`-------- ${name} success rate ${this.output[name].percentage} out of ${this.output[name].count} samples.`)
    }
  }


  plotSuccessRate(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = [];
    for (let name in this.output) {
      data.push(this.output[name].getSuccessRate())
    }

    let layout: Layout = {
      title: "Successrate of " + this.dataset.name,
      width: width,
      height: height,
      xaxis: {title: "Success percentage", range: [0, 100]},
      ...PLOT_MARGINS,
    }

    stack(data, layout);
  }


  plotLocalizationBarGraph(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = [];
    for (let name in this.output) {
      data.push(this.output[name].getClassificationBarTrace())
    }
    let layout : Layout = {
      title: "Classification distribution",
      width: width,
      height: height,
      xaxis:{title:"Room classified"},
      yaxis:{title:"Number of classifications"},
      ...PLOT_MARGINS,
    }

    stack(data, layout);
  }

  plotClassificationGraph(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = [];
    for (let name in this.output) {
      data.push(this.output[name].getExpectedTrace())
      data.push(this.output[name].getClassificationLineTrace())
    }

    let layout : Layout = {
      title: "Classification over time",
      width: width,
      height: height,
      xaxis:{title:"Samples"},
      yaxis:{title:"Room classified"},
      ...PLOT_MARGINS
    }

    stack(data, layout);
  }

  plotSummary(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    this.plotSuccessRate(            width, height);
    this.plotLocalizationBarGraph(   width, height);
    this.plotClassificationGraph(    width, height);
    this.dataset.plotDistanceReport( width, height*1.75);
    this.dataset.plotOffsetGraph(    width, height);
    this.dataset.plotSampleSizeGraph(width, height);
    plot();
  }
}
