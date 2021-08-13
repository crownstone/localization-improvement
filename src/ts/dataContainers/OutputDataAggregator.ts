import {OutputData} from "./OutputData";
import {OutputDataAggregatorContainer} from "./outputComponents/OutputDataAggregatorContainer";
import {Util} from "../util/Util";

export class OutputDataAggregator {

  naiveBayesian : OutputDataAggregatorContainer
  kNN :           OutputDataAggregatorContainer

  locationNameMap : LocationNameMap

  constructor(locationNameMap: LocationNameMap) {
    this.naiveBayesian = new OutputDataAggregatorContainer('naiveBayesian');
    this.kNN           = new OutputDataAggregatorContainer('kNN');
    this.locationNameMap = locationNameMap;
  }

  add(data: OutputData) {
    this.naiveBayesian.add(data.naiveBayesian);
    this.kNN.add(data.kNN);
  }

  merge(aggregator: OutputDataAggregator) {
    this.locationNameMap = Util.deepExtend(this.locationNameMap, aggregator.locationNameMap);
    this.naiveBayesian.merge(aggregator.naiveBayesian)
    this.kNN.merge(aggregator.kNN)
  }

  clear() {
    this.naiveBayesian.clear();
    this.kNN.clear();
  }


  plotConfusionMatrix(sphereId) : boolean {
    let hasDatapoints = false;
    hasDatapoints = this.naiveBayesian.plotConfusionMatrixForSphere(sphereId, this.locationNameMap) || hasDatapoints;
    hasDatapoints = this.kNN.plotConfusionMatrixForSphere(sphereId, this.locationNameMap) || hasDatapoints;
    return hasDatapoints;
  }
}

