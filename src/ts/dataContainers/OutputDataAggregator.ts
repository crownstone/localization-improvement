// import {OutputData} from "./OutputData";
// import {OutputDataAggregatorContainer} from "./outputComponents/OutputDataAggregatorContainer";
// import {Util} from "../util/Util";
// import {Layout, plot, stack} from "nodeplotlib";
// import {PLOT_DEFAULT_HEIGHT, PLOT_DEFAULT_WIDTH, PLOT_MARGINS} from "../config";
//
// export class OutputDataAggregator {
//
//   naiveBayesian : OutputDataAggregatorContainer
//   kNN :           OutputDataAggregatorContainer
//
//   locationNameMap : LocationNameMap
//
//   constructor(locationNameMap: LocationNameMap) {
//     this.naiveBayesian = new OutputDataAggregatorContainer('naiveBayesian');
//     this.kNN           = new OutputDataAggregatorContainer('kNN');
//     this.locationNameMap = locationNameMap;
//   }
//
//   add(data: OutputData) {
//     this.naiveBayesian.add(data.naiveBayesian);
//     this.kNN.add(data.kNN);
//   }
//
//   merge(aggregator: OutputDataAggregator) {
//     this.locationNameMap = Util.deepExtend(this.locationNameMap, aggregator.locationNameMap);
//     this.naiveBayesian.merge(aggregator.naiveBayesian)
//     this.kNN.merge(aggregator.kNN)
//   }
//
//   clear() {
//     this.naiveBayesian.clear();
//     this.kNN.clear();
//   }
//
//
//   plotConfusionMatrix(sphereId: string) : boolean {
//     let hasDatapoints = false;
//     hasDatapoints = this.naiveBayesian.plotConfusionMatrixForSphere(sphereId, this.locationNameMap) || hasDatapoints;
//     hasDatapoints = this.kNN.plotConfusionMatrixForSphere(sphereId, this.locationNameMap) || hasDatapoints;
//     return hasDatapoints;
//   }
//
//   getTotalSuccessRate(sphereId: string) {
//     return {
//       naiveBayesian: Math.round(100*this.naiveBayesian.getTotalSuccessRate(sphereId)),
//       knn:           Math.round(100*this.kNN.getTotalSuccessRate(sphereId)),
//     }
//   }
//
//   printTotalSuccessRate(sphereId: string) {
//     try {
//       console.log(`NaiveBayesian ${Math.round(100*this.naiveBayesian.getTotalSuccessRate(sphereId))}`)
//       console.log(`kNN           ${Math.round(100*this.kNN.getTotalSuccessRate(sphereId))}`)
//     }
//     catch (err) {
//       return false;
//     }
//     return true;
//   }
//
//   plotTotalSuccessRate(sphereId: string) : boolean {
//     try {
//       let data = [
//         this.naiveBayesian.getTotalSuccessRatePlot(sphereId),
//         this.kNN.getTotalSuccessRatePlot(sphereId)
//       ]
//       let layout: Layout = {
//         title: "Total Successrate",
//         width: PLOT_DEFAULT_WIDTH,
//         height: PLOT_DEFAULT_HEIGHT,
//         xaxis: {title: "Success percentage", range: [0, 100]},
//         ...PLOT_MARGINS,
//       }
//
//       stack(data, layout);
//     }
//     catch (err) {
//       return false;
//     }
//     return true;
//   }
//
//   plotSuccessRate(sphereId: string) : boolean {
//     try {
//       let data = [
//         this.naiveBayesian.getSuccessRateTrace(sphereId, this.locationNameMap),
//         this.kNN.getSuccessRateTrace(sphereId, this.locationNameMap),
//       ]
//       let layout: Layout = {
//         title: "Classification distribution",
//         width: PLOT_DEFAULT_WIDTH,
//         height: PLOT_DEFAULT_HEIGHT,
//         yaxis: {title: "Success percentage"},
//         xaxis: {title: "Room classified"},
//         ...PLOT_MARGINS,
//       }
//
//       stack(data, layout);
//     }
//     catch (err) {
//       return false;
//     }
//     return true;
//   }
//
//   plotSummary(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
//     let sphereIds = Object.keys(this.locationNameMap);
//     for (let sphereId of sphereIds) {
//       this.plotTotalSuccessRate(sphereId);
//       this.plotSuccessRate(sphereId);
//       let hasDatapoints = this.plotConfusionMatrix(sphereId);
//       if (hasDatapoints) {
//         this.printTotalSuccessRate(sphereId);
//         plot();
//       }
//     }
//   }
// }

import {OutputData} from "./OutputData";
import {OutputDataAggregatorContainer} from "./outputComponents/OutputDataAggregatorContainer";
import {Util} from "../util/Util";
import {Layout, plot, stack} from "nodeplotlib";
import {PLOT_DEFAULT_HEIGHT, PLOT_DEFAULT_WIDTH, PLOT_MARGINS} from "../config";

export class OutputDataAggregator {

  containers : Record<string, OutputDataAggregatorContainer> = {};

  locationNameMap : LocationNameMap

  constructor(locationNameMap: LocationNameMap) {
    this.locationNameMap = locationNameMap;
  }

  add(data: OutputData) {
    for (let name in data.output) {
      if (this.containers[name] === undefined) {
        this.containers[name] = new OutputDataAggregatorContainer(name);
      }
      this.containers[name].add(data.output[name]);
    }
  }

  merge(aggregator: OutputDataAggregator) {
    this.locationNameMap = Util.deepExtend(this.locationNameMap, aggregator.locationNameMap);
    for (let name in aggregator.containers) {
      if (this.containers[name]) {
        this.containers[name].merge(aggregator.containers[name])
      }
      else {
        this.containers[name] = aggregator.containers[name];
      }
    }
  }

  clear() {
    for (let name in this.containers) {
      this.containers[name].clear();
    }
  }


  plotConfusionMatrix(sphereId: string) : boolean {
    let hasDatapoints = false;
    for (let name in this.containers) {
      hasDatapoints = this.containers[name].plotConfusionMatrixForSphere(sphereId, this.locationNameMap) || hasDatapoints;
    }
    return hasDatapoints;
  }

  getTotalSuccessRate(sphereId: string) {
    let successRate = {};
    for (let name in this.containers) {
      successRate[name] = Math.round(100*this.containers[name].getTotalSuccessRate(sphereId)) || 0
    }
    return successRate;
  }

  printTotalSuccessRate(sphereId: string) {
    try {
      for (let name in this.containers) {
        console.log(`${name} ${Math.round(100*this.containers[name].getTotalSuccessRate(sphereId)) || 0}`);
      }
    }
    catch (err) {
      return false;
    }
    return true;
  }

  plotTotalSuccessRate(sphereId: string) : boolean {
    try {
      let data = [];
      for (let name in this.containers) {
        data.push(this.containers[name].getTotalSuccessRatePlot(sphereId));
      }
      let layout: Layout = {
        title: "Total Successrate",
        width: PLOT_DEFAULT_WIDTH,
        height: PLOT_DEFAULT_HEIGHT,
        xaxis: {title: "Success percentage", range: [0, 100]},
        ...PLOT_MARGINS,
      }

      stack(data, layout);
    }
    catch (err) {
      return false;
    }
    return true;
  }

  plotSuccessRate(sphereId: string) : boolean {
    try {
      let data = [];
      for (let name in this.containers) {
        data.push(this.containers[name].getSuccessRateTrace(sphereId, this.locationNameMap));
      }
      let layout: Layout = {
        title: "Classification distribution",
        width: PLOT_DEFAULT_WIDTH,
        height: PLOT_DEFAULT_HEIGHT,
        yaxis: {title: "Success percentage"},
        xaxis: {title: "Room classified"},
        ...PLOT_MARGINS,
      }

      stack(data, layout);
    }
    catch (err) {
      return false;
    }
    return true;
  }

  plotSummary(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let sphereIds = Object.keys(this.locationNameMap);
    for (let sphereId of sphereIds) {
      this.plotTotalSuccessRate(sphereId);
      this.plotSuccessRate(sphereId);
      let hasDatapoints = this.plotConfusionMatrix(sphereId);
      if (hasDatapoints) {
        this.printTotalSuccessRate(sphereId);
        plot();
      }
    }
  }
}