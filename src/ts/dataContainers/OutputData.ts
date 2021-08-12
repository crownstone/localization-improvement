import {FileUtil} from "../util/FileUtil";
import { plot, stack, clear, Plot, Layout } from 'nodeplotlib';
import {Annotations, ColorScale} from "plotly.js";

export class OutputData {

  path : string = null;
  locationNameMap: LocationNameMap;
  data : LibOutputDataset;

  naiveBayesian : DataContainer
  kNN : DataContainer

  constructor(path: string, locationNameMap: LocationNameMap) {
    this.path = path;
    this.locationNameMap = locationNameMap;
    this.process()
  }

  loadData() {
    this.data = FileUtil.readJSON<LibOutputDataset>(this.path);
  }

  process() {
    if (this.data === undefined) {
      this.loadData();
    }

    this.naiveBayesian = new DataContainer(this.data.naiveBayesian, this.locationNameMap, 'naiveBayesian')
    this.kNN           = new DataContainer(this.data.kNN,           this.locationNameMap, 'kNN')
  }

  plot() {
    let data = [this.naiveBayesian.getBarTrace(),this.kNN.getBarTrace()]
    plot(data)
  }
}

class DataContainer {

  data:            ClassificationResults[];
  locationNameMap: LocationNameMap;
  type: string

  hit        = 0;
  miss       = 0;
  count      = 0;
  rate       = 0;
  percentage = '';

  classifications = {};

  constructor(data : ClassificationResults[], locationNameMap: LocationNameMap, type: string) {
    this.data = data;
    this.locationNameMap = locationNameMap;
    this.type = type;
    this.process();
  }

  process() {
    let data = this.data;
    for (let item of data) {
      if (this.classifications[item.sphereId] === undefined) {
        this.classifications[item.sphereId] = {};
      }

      if (this.classifications[item.sphereId][item.expectedLabel] === undefined) {
        this.classifications[item.sphereId][item.expectedLabel] = {}
      }

      if (this.classifications[item.sphereId][item.expectedLabel][item.result] === undefined) {
        this.classifications[item.sphereId][item.expectedLabel][item.result] = 0;
      }

      this.classifications[item.sphereId][item.expectedLabel][item.result] += 1;

      if (item.result === item.expectedLabel) {
        this.hit++;
      }
      else {
        this.miss++;
      }
      this.count++;
    }
    this.rate = this.hit / this.count;
    this.percentage = (100*this.rate).toFixed(3) + "%";
  }

  getBarTrace() {
    let x = [];
    let y = [];
    for (let sphereId in this.classifications) {
      for (let expectedId in this.classifications[sphereId]) {
        for (let locationId in this.classifications[sphereId][expectedId]) {
          x.push(this.locationNameMap[sphereId][locationId]);
          y.push(this.classifications[sphereId][expectedId][locationId])
        }
      }
    }
    const trace: Plot = {x: x, y: y, type: 'bar', name:this.type};
    return trace;
  }

  plot(stackPlot = false) {
    if (stackPlot) {
      stack([this.getBarTrace()])
    }
    else {
      plot([this.getBarTrace()]);
    }
  }
}

export class DataAggregator {

  naiveBayesian : DataAggregatorContainer
  kNN : DataAggregatorContainer

  constructor() {
    this.naiveBayesian = new DataAggregatorContainer('naiveBayesian');
    this.kNN           = new DataAggregatorContainer('kNN');
  }

  add(data: OutputData) {
    this.naiveBayesian.add(data.naiveBayesian);
    this.kNN.add(data.kNN);
  }

  plot() {
    this.naiveBayesian.plot();
    this.kNN.plot();
    plot()
  }

}

class DataAggregatorContainer {

  data = {};

  type : string;

  constructor(type) {
    this.type = type
  }

  add(dataContainer: DataContainer) {
    let data = dataContainer.classifications;
    for (let sphereId in data) {
      if (this.data[sphereId] === undefined) {
        this.data[sphereId] = {};
      }

      for (let expectedId in data[sphereId]) {
        if (this.data[sphereId][expectedId] === undefined) {
          this.data[sphereId][expectedId] = {name: dataContainer.locationNameMap[sphereId][expectedId], classifications: {}};
        }

        for (let locationId in data[sphereId][expectedId]) {
          if (this.data[sphereId][expectedId].classifications[locationId] === undefined) {
            this.data[sphereId][expectedId].classifications[locationId] = {name: dataContainer.locationNameMap[sphereId][locationId], count: 0};
          }
          this.data[sphereId][expectedId].classifications[locationId].count += data[sphereId][expectedId][locationId];
        }
      }
    }
  }

  plot() {
    let dataset = this.data;
    for (let sphereId in dataset) {
      let sphere = dataset[sphereId];
      this._plotSphere(sphere);
    }
  }

  _plotSphere(sphere) {
    let xKeys = [];
    let yKeys = [];

    let allKeys = {};
    for (let expectedId in sphere) {
      xKeys.push({id: expectedId, label: `${expectedId}:${sphere[expectedId].name}`});
      allKeys[expectedId] = {id: expectedId, label: `${expectedId}:${sphere[expectedId].name}`}
      for (let locationId in sphere[expectedId].classifications) {
        yKeys.push({id:locationId, label: `${locationId}:${sphere[expectedId].classifications[locationId].name}`});
        allKeys[locationId] = {id: locationId, label: `${locationId}:${sphere[expectedId].classifications[locationId].name}`}
      }
    }

    let arr = Object.values(allKeys)

    arr.sort((a,b) => {
      // @ts-ignore
      return Number(a.id) > Number(b.id) ? 1 : -1
    })


    let zValues = [];
    for (let x of arr) {
      let zArr = [];
      for (let y of arr) {
        // @ts-ignore
        zArr.push(sphere[y.id]?.classifications[x.id]?.count || 0)
      }
      zValues.push(zArr)
    }


    // @ts-ignore
    let labels = arr.map((a) => a.label)

    let colorscaleValue : ColorScale = [
      [0, '#3D9970'],
      [1, '#001f3f']
    ];

    let data : Plot[] = [{
      x: labels,
      y: labels,
      z: zValues,
      type: 'heatmap',
      colorscale: colorscaleValue,
      showscale: false
    }];

    let layout : Layout = {
      title: 'ConfusionMatrix '+this.type,
      annotations: [],
      autosize:false,
      margin: {l: 120, t: 180},
      xaxis: {
        ticks: '',
        side: 'top',

      },
      yaxis: {
        ticks: '',
        ticksuffix: ' ',
        autorange:'reversed',
      },
    };

    for ( let i = 0; i < labels.length; i++ ) {
      for ( let j = 0; j < labels.length; j++ ) {
        let currentValue = zValues[j][i];
        let textColor = 'black';
        if (currentValue != 0.0) {
          textColor = 'white';
        }
        let result : Partial<Annotations> = {
          // xref: 'x1',
          // yref: 'YAxisName',
          x: labels[i],
          y: labels[j],
          text: String(zValues[j][i]),
          font: {
            color: textColor
          },
          showarrow: false,
        };
        layout.annotations.push(result);
      }
    }

    stack(data, layout);
  }

}

