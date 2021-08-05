// Fingerprints
interface Datapoint {
  devices: DevicesData,
  timestamp: Timestamp
}
interface AppFingerprintFormat {
  spheres: {
    [sphereId: string]: {  // sphereCloudId
      [locationId: LocationId]: {
        name: string,       // location name
        cloudId: string,    // location cloudId
        fingerprint: Datapoint[]
      }
    }
  }
}

// Datasets
type AppDatapoint = [Timestamp, DeviceUUID, Rssi];
type AppDatapointArray = AppDatapoint[];
interface AppDatasetFormat {
  sphereCloudId: string,
  sphere: {
    name: string,
    iBeaconUUID: string,
    uid: number,
    cloudId: string,
    aiName: string,
    latitude: number,
    longitude: number,
    updatedAt: string | Timestamp
  },
  location: {
    name: string,
    uid: LocationId,
  }
  dataset: AppDatapointArray[]
}

