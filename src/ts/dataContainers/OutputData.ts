import {FileUtil} from "../util/FileUtil";
import {Layout, plot, stack} from 'nodeplotlib';
import {OutputDataContainer} from "./outputComponents/OutputDataContainer";
import {Dataset} from "./Dataset";
import {PLOT_DEFAULT_HEIGHT, PLOT_DEFAULT_WIDTH, PLOT_MARGINS} from "../config";

export class OutputData {

  path : string = null;
  locationNameMap: LocationNameMap;
  _data : LibOutputDataset;

  dataset: Dataset

  naiveBayesian : OutputDataContainer
  kNN           : OutputDataContainer

  constructor(path: string, dataset: Dataset, locationNameMap: LocationNameMap) {
    this.path = path;
    this.locationNameMap = locationNameMap;
    this.dataset = dataset;
    this.process()
  }

  loadData() {
    this._data = FileUtil.readJSON<LibOutputDataset>(this.path);
  }

  process() {
    if (this._data === undefined) {
      this.loadData();
    }

    this.naiveBayesian = new OutputDataContainer(this._data.naiveBayesian, this.locationNameMap, 'naiveBayesian')
    this.kNN           = new OutputDataContainer(this._data.kNN,           this.locationNameMap, 'kNN')
  }

  printSuccess() {
    console.log(`-------- naiveBayesian success rate ${this.naiveBayesian.percentage} out of ${this.naiveBayesian.count} samples.`)
    console.log(`-------- kNN           success rate ${this.kNN.percentage} out of ${this.kNN.count} samples.`)
  }


  plotSuccessRate(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = [
      this.naiveBayesian.getSuccessRate(),
      this.kNN.getSuccessRate()
    ]
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
    let data = [
      this.naiveBayesian.getClassificationBarTrace(),
      this.kNN.getClassificationBarTrace()
    ]
    let layout : Layout = {
      title: "Classification distribution",
      width: width,
      height: height,
      yaxis:{title:"Room classified"},
      xaxis:{title:"Amount of classifications"},
      ...PLOT_MARGINS,
    }

    stack(data, layout);
  }

  plotClassificationGraph(width = PLOT_DEFAULT_WIDTH, height = PLOT_DEFAULT_HEIGHT) {
    let data = [
      this.naiveBayesian.getExpectedTrace(),
      this.naiveBayesian.getClassificationLineTrace(),
      this.kNN.getClassificationLineTrace(),
    ];
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
    this.dataset.plotDistanceReport( width, height);
    this.dataset.plotOffsetGraph(    width, height);
    plot();
  }
}



