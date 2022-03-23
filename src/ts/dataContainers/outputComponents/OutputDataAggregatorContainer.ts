import { stack, Plot, Layout } from 'nodeplotlib';
import {Annotations, ColorScale} from "plotly.js";
import {getColor, OutputDataContainer} from "./OutputDataContainer";
import {Util} from "../../util/Util";

export class OutputDataAggregatorContainer {

  _data : OutputDataFormat = {};

  type : string;

  constructor(type) {
    this.type = type
  }

  clear() {
    this._data = {};
  }

  add(dataContainer: OutputDataContainer) {
    let data = dataContainer.classifications;
    for (let sphereId in data) {
      if (this._data[sphereId] === undefined) {
        this._data[sphereId] = {};
      }

      for (let expectedId in data[sphereId]) {
        if (this._data[sphereId][expectedId] === undefined) {
          this._data[sphereId][expectedId] = {};
        }

        for (let locationId in data[sphereId][expectedId]) {
          if (this._data[sphereId][expectedId][locationId] === undefined) {
            this._data[sphereId][expectedId][locationId] = 0;
          }
          this._data[sphereId][expectedId][locationId] += data[sphereId][expectedId][locationId];
        }
      }
    }
  }

  merge(aggregatorData: OutputDataAggregatorContainer) {
    if (this.type !== aggregatorData.type) {
      throw new Error("TYPES MUST MATCH WHEN MERGING.");
    }

    Util.deepExtend(this._data, aggregatorData._data)
  }


  plotConfusionMatrixForSphere(sphereId: string, locationNameMap: LocationNameMap) : boolean {
    let allKeys : {[locationId: string] : {id: string, label: string}} = {};

    let sphere = this._data[sphereId];
    if (!sphere) { return false; }

    for (let locationId in locationNameMap[sphereId]) {
      allKeys[locationId] = {id: locationId, label: `${locationId}:${locationNameMap[sphereId][locationId]}`}
    }

    let locationDataObjects = Object.values(allKeys)
    locationDataObjects.sort((a,b) => {
      return Number(a.id) > Number(b.id) ? 1 : -1
    });

    let hasDatapoints = false;
    let zValues = [];
    for (let x of locationDataObjects) {
      let zArr = [];
      for (let y of locationDataObjects) {
        if (sphere[y.id]?.[x.id] !== undefined) {
          zArr.push(sphere[y.id]?.[x.id]);
          hasDatapoints = true;
        }
        else {
          zArr.push(0)
        }
      }
      zValues.push(zArr);
    }

    if (!hasDatapoints) { return false; }

    let labelsX = locationDataObjects.map(a => `truth:${a.label}`)
    let labelsY = locationDataObjects.map(a => `${a.label}`)

    let colorscaleValue : ColorScale = [
      [0, '#3D9970'],
      [1, '#001f3f']
    ];

    let data : Plot[] = [{
      x: labelsX,
      y: labelsY,
      z: zValues,
      type: 'heatmap',
      colorscale: colorscaleValue,
      showscale: false
    }];

    let layout : Layout = {
      title: 'ConfusionMatrix ' + this.type + " for sphere " + sphereId,
      annotations: [],
      autosize:false,
      height: labelsY.length*50,
      width: labelsX.length*100,
      margin: {l: 150, t: 180},
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

    for ( let i = 0; i < labelsX.length; i++ ) {
      for ( let j = 0; j < labelsY.length; j++ ) {
        let currentValue = zValues[j][i];
        let textColor = 'black';
        if (currentValue != 0.0) {
          textColor = 'white';
        }
        let result : Partial<Annotations> = {
          // xref: 'x1',
          // yref: 'YAxisName',
          x: labelsX[i],
          y: labelsY[j],
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

    return hasDatapoints;
  }

  getSuccessRate(sphereId, locationId) {
    let sphere = this._data[sphereId];
    if (!sphere) { throw "NO_SPHERE"; }

    let sum = 0
    for (let otherLocationId in sphere[locationId]) {
      sum += sphere[locationId][otherLocationId];
    }

    if (sum === 0) {
      return 0
    }
    return (sphere[locationId][locationId] || 0)/sum;
  }

  getTotalSuccessRate(sphereId: string) : number {
    let sphere = this._data[sphereId];
    if (!sphere) { throw "NO_SPHERE"; }

    let avg = 0
    for (let expectedId in sphere) {
      avg += this.getSuccessRate(sphereId, expectedId);
    }

    return avg/Object.keys(sphere).length;
  }

  getTotalSuccessRatePlot(sphereId: string) : Plot {
    const trace: Plot = {x: [Math.round(100*this.getTotalSuccessRate(sphereId))], type: 'bar', name:this.type, marker:{color: getColor(this.type)}};
    return trace
  }

  getSuccessRateTrace(sphereId: string, locationNameMap: LocationNameMap) : Plot {
    let sphere = this._data[sphereId];
    if (!sphere) { throw "NO_SPHERE"; }

    let x = [];
    let y = [];

    for (let expectedId in sphere) {
      x.push(locationNameMap[sphereId][expectedId])
      y.push((100*this.getSuccessRate(sphereId, expectedId)).toFixed(2));
    }
    const trace: Plot = {x: x, y: y, type: 'bar', name:this.type, marker:{color: getColor(this.type)}};
    return trace;
  }

}
