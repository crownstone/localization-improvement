interface NBClassificationResults {
  result: LocationId | null,
  probabilities: {
    [locationId: LocationId]: {
      probability: number,
      sampleSize: number
    }
  }
}

interface LibOutput {
  NaiveBayesian: NBClassificationResults[]
}

