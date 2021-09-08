import {Fingerprint} from "./Fingerprint";
import {Dataset} from "./Dataset";
import {getDistance, Util} from "../util/Util";


export class FingerprintGenerator {


  datasets : Dataset[];
  data: AppFingerprintFormat = {spheres:{}};
  generationPool = {};

  constructor() {}

  loadDatasets(datasets: Dataset[]) {
    this.datasets = datasets;
    this.data = {spheres: {}};

    // the generation pool will collect all datapoints that belong to a location in a sphere. These
    // can be spread out over multiple datasets so we collect them first, then start to generate the
    // fingerprint from them.
    this.generationPool = {};

    let counter = 0;

    for (let dataset of datasets) {
      // initialize datset
      dataset.initialize();

      // add identifiers to the points
      for (let point of dataset._data.dataset) {
        // @ts-ignore
        point.id = `${dataset.name}_____${counter++}`;
      }

      if (this.data.spheres[dataset.sphereId] === undefined) {
        this.generationPool[dataset.sphereId] = {}
        this.data.spheres[dataset.sphereId] = {sphere: {name: dataset.sphereName, cloudId: dataset.sphereId}, fingerprints: {}}
      }
      this.data.spheres[dataset.sphereId].fingerprints[dataset.locationId] = {
        name: dataset.locationName,
        fingerprint: []
      };

      if (this.generationPool[dataset.sphereId][dataset.locationId] === undefined) {
        this.generationPool[dataset.sphereId][dataset.locationId] = [];
      }

      this.generationPool[dataset.sphereId][dataset.locationId].push(dataset);
    }
  }

  _clearFingerprint() {
    for (let sphereId in this.data.spheres) {
      for (let locationId in this.data.spheres[sphereId].fingerprints) {
        this.data.spheres[sphereId].fingerprints[locationId].fingerprint = [];
      }
    }
  }

  generateFingerprintRandomly(size = 100) {
    this._clearFingerprint();

    for (let sphereId in this.generationPool) {
      // console.log("Gathering fingerprints for sphere", this.data.spheres[sphereId].sphere.name, `(${sphereId})`);
      for (let locationId in this.generationPool[sphereId]) {
        // console.log("Gathering fingerprints for location", this.data.spheres[sphereId].fingerprints[locationId].name, `(${locationId})`);
        let locationFingerprint = []
        for (let i = 0; i < size; i++) {

          let length = 0
          for (let dataset of this.generationPool[sphereId][locationId]) {
            length += dataset._data.dataset.length;
          }

          if (length === 0) {
            break;
          }

          let index = Math.floor(Math.random()*length);
          for (let dataset of this.generationPool[sphereId][locationId]) {
            if (index - dataset._data.dataset.length < 0) {
              locationFingerprint.push(dataset._data.dataset[index]);
              dataset._data.dataset.splice(index,1);
              break;
            }
            else {
              index -= dataset._data.dataset.length;
            }
          }
        }

        this.data.spheres[sphereId].fingerprints[locationId].fingerprint = locationFingerprint;
        // console.log("Collected",locationFingerprint.length,"samples");
      }
    }
  }

  generateFingerprintBasedOnDistance(size = 100) {
    this._clearFingerprint();

    for (let sphereId in this.generationPool) {
      console.log("Gathering fingerprints for sphere", this.data.spheres[sphereId].sphere.name, `(${sphereId})`);
      for (let locationId in this.generationPool[sphereId]) {
        console.log("Gathering fingerprints for location", this.data.spheres[sphereId].fingerprints[locationId].name, `(${locationId})`);
        let locationFingerprint = []
        let locationSets : Dataset[] = this.generationPool[sphereId][locationId];

        locationFingerprint.push(locationSets[0]._data.dataset[0]);
        locationSets[0]._data.dataset.splice(0,1);
        let distanceMap = {};
        for (let i = 1; i < size; i++) {
          let length = 0
          for (let dataset of locationSets) {
            length += dataset._data.dataset.length;
          }

          if (length === 0) {
            break;
          }

          // get the point in all the sets that is furthest away from the current collection of points.
          let maxD = -Infinity;
          let candidate = {dsIndex: 0, itemIndex: 0};
          for (let j = 0; j < locationSets.length; j++) {
            let dataArray = locationSets[j]._data.dataset;
            for (let k = 0; k < dataArray.length; k++) {
              let newPoint = dataArray[k];
              for (let existingPoint of locationFingerprint) {

                // use LUT
                if (distanceMap[`${newPoint.id}.${existingPoint.id}`] === undefined) {
                  let distance = getDistance(newPoint, existingPoint)[0];
                  distanceMap[`${newPoint.id}.${existingPoint.id}`] = distance;
                  distanceMap[`${existingPoint.id}.${newPoint.id}`] = distance;
                }

                let distance = distanceMap[`${newPoint.id}.${existingPoint.id}`];
                if (distance > maxD) {
                  maxD = distance;
                  candidate.dsIndex = j;
                  candidate.itemIndex = k;
                }
              }
            }
          }

          locationFingerprint.push(locationSets[candidate.dsIndex]._data.dataset[candidate.itemIndex]);
          locationSets[candidate.dsIndex]._data.dataset.splice(candidate.itemIndex, 1);
        }

        this.data.spheres[sphereId].fingerprints[locationId].fingerprint = locationFingerprint;
      }
    }
  }


  getFingerprint(name: string = "GeneratedFingerprint") : Fingerprint {
    let newFingerprint = new Fingerprint();
    newFingerprint._data = Util.deepCopy(this.data);
    newFingerprint.name = name;
    return newFingerprint;
  }
}