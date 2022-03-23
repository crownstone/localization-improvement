// Fingerprint
interface libFingerprint {
  sphereId:   string,
  locationId: LocationId,
  data:       FingerprintDatapoint[]
}
type FingerprintLibFileFormat = libFingerprint[]


// Dataset
type LibDatapoint = [DeviceUUID, Rssi];
interface DatapointFile {
  in: LibDatapoint[],
  label: LocationId,
  sphereId: string,
}
type DatasetFileLibFormat = DatapointFile[]

interface ClassifierInterface {
  name: string,
  train:    (fingerprint: AppFingerprintFormat) => void,
  classify: (inputVector : FingerprintDatapoint, sphereId: string) => LocationId
  clear:    () => void
}