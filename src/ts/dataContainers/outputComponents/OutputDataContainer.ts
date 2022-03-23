import { plot, stack, clear, Plot, Layout } from 'nodeplotlib';

export class OutputDataContainer {

  _data:           ClassificationResults[];
  locationNameMap: LocationNameMap;
  type: string

  hit        = 0;
  miss       = 0;
  count      = 0;
  rate       = 0;
  percentage = '';

  classifications = {};

  constructor(data : ClassificationResults[], locationNameMap: LocationNameMap, type: string) {
    this._data = data;
    this.locationNameMap = locationNameMap;
    this.type = type;
    this.process();
  }

  process() {
    for (let item of this._data) {
      if (this.classifications[item.sphereId] === undefined) {
        this.classifications[item.sphereId] = {};
      }

      let expected = getLabel(item.expectedLabel);
      let result = getLabel(item.result);

      if (this.classifications[item.sphereId][expected] === undefined) {
        this.classifications[item.sphereId][expected] = {}
      }

      if (this.classifications[item.sphereId][expected][result] === undefined) {
        this.classifications[item.sphereId][expected][result] = 0;
      }

      this.classifications[item.sphereId][expected][result] += 1;

      if (result === expected) {
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

  getSuccessRate() {
    const trace: Plot = {x: [Math.round(this.rate*100)], type: 'bar', name:this.type, marker:{color: getColor(this.type)}};
    return trace;
  }

  getClassificationBarTrace() {
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
    const trace: Plot = {x: x, y: y, type: 'bar', name:this.type, marker:{color: getColor(this.type)}};
    return trace;
  }

  getClassificationLineTrace() {
    let y = [];

    for (let result of this._data) {
      y.push(this._label(result.sphereId, getLabel(result.result)));
    }
    const trace: Plot = {y: y, name:this.type, line:{color:getColor(this.type)}};
    return trace;
  }

  getExpectedTrace() {
    let y = [];

    for (let result of this._data) {
      y.push(this._label(result.sphereId, getLabel(result.expectedLabel)));
    }
    const trace: Plot = {y: y, name: "Expected", line:{color:"#b1eb76"}};
    return trace;
  }

  _label(sphereId, locationId) {
    return `${locationId}:${this.locationNameMap[sphereId][locationId]}`
  }
}


/**
 * This is to be ready for split fingerprints.
 * The label of a split fingerprint can be 5.1 5.2 5.3 etc, which all belong to room 5
 * @param str
 */
function getLabel(str) {
  if (str) {
    return str.split(".")[0]
  }
  return str;
}

export function getColor(type) {
  switch (type) {
    case "naiveBayesian":
      return "#2c9aa8"
    case "kNN":
      return "#ff9b08"
    default:
      return "#2c9aa8"
  }
}