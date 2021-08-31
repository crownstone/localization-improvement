type Rssi        = number;
type Timestamp   = number;
type DeviceUUID  = string; // <ibeaconUUID>_Maj:<ibeaconMajor>_Min:<ibeaconMinor> like D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:47254_Min:57646
type LocationId  = string;
type DevicesData = Record<DeviceUUID, Rssi>

type Platform = 'ios' | 'android'
interface LocationNameMap {
  [sphereId: string]: {
    [locationId: string]: string
  }
}

interface CrownstoneMap {
  [crownstoneIbeaconId: string]: boolean
}

interface SphereNameMap {
  [sphereId: string]: string
}

interface OutputDataFormat {
  [sphereId: string]: {
    [expectedId: string]: {
      [locationId: string]: number
    }
  }
}

