interface SphereData {
  name: string,
  iBeaconUUID: string,
  uid: number,
  cloudId: string,
  aiName: string,
  latitude: number,
  longitude: number,
  updatedAt: string | Timestamp
}

// Fingerprints
interface FingerprintDatapoint {
  devices: DevicesData,
  timestamp: Timestamp
}
interface AppFingerprintFormat {
  spheres: {
    [sphereId: string]: {  // sphereCloudId
      sphere: SphereData,
      fingerprints: {
        [locationId: LocationId]: {
          name: string,       // location name
          cloudId: string,    // location cloudId
          fingerprint: FingerprintDatapoint[]
        }
      }
    }
  }
}

// Datasets
interface AppDatasetFormat {
  sphereCloudId: string,
  sphere: SphereData,
  location: {
    name: string,
    uid: LocationId,
  }
  dataset: FingerprintDatapoint[]
}

