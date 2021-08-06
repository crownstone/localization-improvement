interface NBClassificationResults {
  result: LocationId | null,
  expectedLabel: LocationId,
  probabilities: {
    [locationId: LocationId]: {
      probability: number,
      sampleSize: number
    }
  }
}

interface KNNClassificationResults {
  result: LocationId | null,
  expectedLabel: LocationId,
}

interface NearestCrownstoneClassificationResults {
  result: LocationId | null,
  expectedLabel: LocationId,
}


interface LibOutputDataset {
  NaiveBayesian:     NBClassificationResults[],
  KNN:               KNNClassificationResults[],
  NearestCrownstone: NearestCrownstoneClassificationResults[],
}

