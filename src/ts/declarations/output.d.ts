interface ClassificationResults {
  sphereId: string,
  result: LocationId | null,
  expectedLabel: LocationId,
}

interface NBClassificationResults extends ClassificationResults {
  probabilities: {
    [locationId: LocationId]: {
      probability: number,
      sampleSize: number
    }
  }
}

interface KNNClassificationResults extends ClassificationResults {
  distanceMap: {
    locationId: {
      dataIndex: number // squared distance of this point to the vector
    }
  }
}



interface LibOutputDataset {
  naiveBayesian:     NBClassificationResults[],
  kNN:               KNNClassificationResults[],
}

