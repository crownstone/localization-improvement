import * as fs from "fs";
import {Util} from "../util/Util";

type ArffAttribute = ArffAttributeDefault | ArffAttributeNominal | ArffAttributeDate


// @attribute <attribute-name> <datatype>
interface ArffAttributeDefault {
  name: string,
  type: "numeric" | "string"
}

// @attribute <attribute-name> date [<date-format>]
interface ArffAttributeDate {
  name: string,
  type: "date"
  format?: string // default "yyyy-MM-dd'T'HH:mm:ss"
}

// @attribute <attribute-name> {Iris-setosa,Iris-versicolor,Iris-virginica}
interface ArffAttributeNominal {
  name: string,
  type: "nominal"
  options: string[]
}

type AttributeName = string;
type ArffDataObject = Record<AttributeName, number | string>;
type ArffDataArray = (string | number)[];
type ArffData = ArffDataObject | ArffDataObject[] | ArffDataArray | ArffDataArray[];

interface ArffFileOptions {
  introduction: string,
  checkData: boolean,
}

type AttributeMap = { type: "numeric" | "string" | "date", index: number } | { type: "nominal" , index:number, options: string[] };

export class Arff {

  _name: string;
  _attributes : ArffAttribute[] = [];
  _attributeMap : Record<AttributeName, AttributeMap> = {};
  _data : ArffDataArray[] = [];
  _sparseData: ArffDataObject[] = [];

  _introduction : string;
  _checkData : boolean = true;

  constructor(name : string, options?: Partial<ArffFileOptions>) {
    this._name = name;
    this._checkData = options?.checkData ?? this._checkData;
    this._introduction = options?.introduction;
    return this;
  }

  addNumericAttribute(attributeName: string | string[]) {
    let arrayValue = getArrayValue(attributeName);
    for (let value of arrayValue) { this._attributes.push({type:"numeric", name: value}); }
  }

  addStringAttribute(attributeName: string | string[]) {
    let arrayValue = getArrayValue(attributeName);
    for (let value of arrayValue) { this._attributes.push({type:"string", name: value}); }
  }

  addNominalAttribute(attributeName : string | string[], values: string[] | string[][]) {
    let arrayValue = getArrayValue(attributeName);
    let nestedOptions = getNestedArrayValue(values);
    for (let i = 0; i < arrayValue.length; i++) {
      this._attributes.push({type:"nominal", name: arrayValue[i], options: nestedOptions[i]});
    }
  }

  addDateAttribute(attributeName: string | string[], format?: string | string[]) {
    let arrayValue = getArrayValue(attributeName);
    let nestedOptions = getArrayValue(format);
    for (let i = 0; i < arrayValue.length; i++) {
      let data : ArffAttribute = {type:"date", name: arrayValue[i]}
      if (format) {
        data.format = nestedOptions[i];
      }
      this._attributes.push(data);
    }
  }

  addData(data: ArffData) {
    if (this._attributes.length === 0) {
      throw "First load attributes before loading data."
    }

    this._generateAttributeMap();

    if (Array.isArray(data)) {
      for (let datapoint of data) {
        if (Array.isArray(datapoint)) { // ArffDataArray
          this._addDataArray(datapoint);
        }
        else if (typeof datapoint === 'object') { // ArffDataObject
          this._addDataObject(datapoint);
        }
        else { // it was a single data row entry, so data itself was an ArffDataArray
          this._addDataArray(data as ArffDataArray);
          break;
        }
      }

    }
    else {
      // ArffDataObject
      this._addDataObject(data);
    }
  }

  _generateAttributeMap() {
    this._attributeMap = {};
    for (let i = 0; i < this._attributes.length; i++) {
      let item = this._attributes[i]
      if (item.type === 'nominal') {
        this._attributeMap[item.name] = {type: item.type, index: i, options: item.options};
      }
      else {
        this._attributeMap[item.name] = {type: item.type, index: i};
      }
    }
  }

  _addDataObject(data: ArffDataObject, sparse = false) {
    let row = new Array(this._attributes.length);

    for (let i = 0; i < this._attributes.length; i++) {
      row[i] = '?';
    }

    let loaded = false;
    for (let field in data) {
      let map = this._attributeMap[field]

      if (map === undefined) {
        console.error("Trying to load", field)

        throw "Invalid attribute provided. Only loaded attribute names can be keys of the data object."
      }

      if (this._checkData) {
        if (map.type === "numeric" && typeof data[field] !== "number") {
          console.error("Tried to load ", field);
          throw "Invalid data type provided for type number.";
        }
        else if (map.type === "nominal") {
          if (typeof data[field] !== "string") {
            throw "Nominal types can only be strings."
          }
          else if (map.options.indexOf(String(data[field])) === -1) {
            console.error("Tried to load ", field);
            throw "Invalid data type provided for type nominal.";
          }
        }
      }

      loaded = true;
      row[map.index] = data[field];
    }

    if (loaded) {
      if (sparse) {
        this._sparseData.push(data);
      }
      else {
        this._data.push(row);
      }
    }
  }

  _addDataArray(data: ArffDataArray) {
    if (data.length !== this._attributes.length) {
      throw "Invalid data length. Data must have as many fields as the number of loaded attributes."
    }

    if (this._checkData) {
      for (let i = 0; i < data.length; i++) {
        let attribute = this._attributes[i]
        if (attribute.type === "numeric" && typeof data[i] !== "number") {
          throw "Invalid data type provided for type number.";
        }
        else if (attribute.type === "nominal") {
          if (typeof data[i] !== "string") {
            throw "Nominal types can only be strings."
          }
          else if (attribute.options.indexOf(String(data[i])) === -1) {
            throw "Invalid data type provided for type nominal.";
          }
        }
      }
    }

    this._data.push(data);
  }

  addSparseData(data: ArffDataObject) {
    this._addDataObject(data, true);
  }

  store(path: string) {
    let content = this.stringify();
    fs.writeFileSync(path, content, 'utf-8');
  }

  join(otherArff: Arff) {
    if (Util.deepCompare(this._attributes, otherArff._attributes) === false) {
      throw "Can not join different attributes";
    }

    if (Util.deepCompare(this._attributeMap, otherArff._attributeMap) === false) {
      throw "Can not join different attribute maps";
    }

    for (let point of otherArff._data) {
      this._data.push(point);
    }

    for (let point of otherArff._sparseData) {
      this._sparseData.push(point);
    }
  }

  stringify() : string {
    let content = '';
    if (this._introduction) {
      let lines = this._introduction.split("\n")
      for (let line of lines) {
        content += "% " + line;
      }
    }

    content += `@relation ${wrapStr(this._name)}\n`;
    content += `\n`;

    for (let attribute of this._attributes) {
      switch (attribute.type) {
        case "date":
          content += `@attribute ${attribute.name} ${attribute.type}`;
          if (attribute.format) { content += ` ${attribute.format}`};
          content += `\n`;
          break;
        case "nominal":
          content += `@attribute ${attribute.name} {${attribute.options.map((a) => wrapStr(a)).join(',')}}\n`;
          break;
        default:
          content += `@attribute ${attribute.name} ${attribute.type}\n`
      }
    }

    content += `\n`;
    content += `@data\n`;
    for (let datapoint of this._data) {
      let items = datapoint.map((a) => {
        return wrap(a);
      });
      content += items.join(",");
      content += `\n`;
    }


    for (let datapoint of this._sparseData) {
      content += `{`
      let entries = [];
      for (let field in datapoint) {
        let val = wrap(datapoint[field]);
        entries.push(`${this._attributeMap[field].index} ${val}`);
      }
      content += entries.join(",");
      content += '\n';
    }

    return content;
  }
}


function getArrayValue(val: string | string[]) : string[] {
  let arrayValue : string[];
  if (typeof val === "string") { arrayValue = [val]; } else { arrayValue = val; }
  return arrayValue.map((a) => { return a; });
}


function getNestedArrayValue(val: string[] | string[][]) : string[][] {
  let arrayValue : string[][] = [];
  let nested = false;
  let arr : string[] = [];
  for (let i = 0; i < val.length; i++) {
    let item = val[i];
    if (typeof item === 'string') {
      arr.push(item)
    }
    else {
      nested = true;
      arrayValue.push(item.map((a) => { return a; }));
    }
  }
  if (nested === false) {
    arrayValue.push(arr.map((a) => { return a; }));
  }
  return arrayValue;
}


function wrap(val: string | number) {
  if (typeof val === 'string' && val.indexOf(" ") !== -1) {
    val = `"${val}"`;
  }
  return val;
}


function wrapStr(val: string) {
  if (val.indexOf(" ") !== -1) {
    val = `"${val}"`;
  }
  return val;
}


