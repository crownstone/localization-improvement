// Fingerprint
interface Fingerprint {
  sphereId:   string,
  locationId: LocationId,
  data:       FingerprintDatapoint[]
}
type FingerprintLibFileFormat = Fingerprint[]


// Dataset
type LibDatapoint = [DeviceUUID, Rssi];
interface DatapointFile {
  in: LibDatapoint[],
  label: LocationId,
  sphereId: string,
}
type DatasetFileLibFormat = DatapointFile[]

