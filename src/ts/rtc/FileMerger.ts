export class FileMerger {

  data = '';
  lastPart = -1;
  totalLength: number;
  finished = false;
  transferId : string;
  startTime;

  constructor(data: RtcFileTransfer) {
    this.totalLength = data.totalLength;
    this.transferId = data.transferId;
    this.startTime = Date.now();
  }


  collect(data: RtcFileTransfer) {
    if (this.finished)                         { throw "ALREADY_FINISHED";         }
    if (this.transferId   !== data.transferId) { throw "INCOMPATIBLE_TRANSFER_ID"; }
    if (this.lastPart + 1 !== data.part)       { throw "INVALID_PART_ORDER";       }

    this.lastPart = data.part;
    this.data += data.data;

    if (this.data.length === this.totalLength) {
      this.finished = true;
      console.log("Downloaded", this.data.length, "in", ((Date.now() - this.startTime)*0.001).toFixed(3),'seconds');
    }
  }
}