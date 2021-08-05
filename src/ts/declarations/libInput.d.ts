// Fingerprints
interface Datapoint {
  devices: DevicesData,
  timestamp: Timestamp
}

interface Fingerprint {
  sphereId:   string,
  locationId: LocationId,
  data:       Datapoint[]
}
type FingerprintLibFileFormat = Fingerprint[]



// Dataset
type LibDatapoint = [DeviceUUID, Rssi];
interface DatapointFile {
  in: LibDatapoint[],
  label: LocationId,
  sphereId: string,
}
type DatasetFileLibFormat     = DatapointFile[]

