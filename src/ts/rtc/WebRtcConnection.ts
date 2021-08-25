import {FileUtil} from "../util/FileUtil";
import {FileMerger} from "./FileMerger";
import {LocalizationDataUtil} from "./FilePathUtil";

export class RtcConnectionHandler {

  connection;
  cleanupCallback;

  fileInProgress : FileMerger | null = null;
  receiveExpectationTimeout: NodeJS.Timeout;

  constructor(connection, cleanupCallback) {
    this.connection      = connection;
    this.cleanupCallback = cleanupCallback;
    this.initialize();
  }

  initialize() {
    this.connection.on("close", () => {
      console.log('Connection closed.');
      this.destroy();
    })
    this.connection.on('open', () => {
      console.log('Connection established.');
      this.connection.on('data', (data) => {
        this.handleIncomingData(data);
      });

      this.send({
        type:'message',
        data:'connection established.'
      })
    })
  }

  destroy() {
    this.connection.close();
    this.cleanupCallback();
  }


  handleIncomingData(data: RtcMessageProtocol) {
    if (typeof data !== 'object' || typeof data?.type !== 'string') {
      this.send({type:'report', code: "TERMINATION_REASON_INVALID_MESSAGE", data:'invalid message received, closing connection'});
      this.destroy();
      return;
    }

    console.log("got message", data.type)
    switch (data?.type) {
      case "message":
        console.log(data.data);
        break;
      case "fileTransfer":
        this.handleFile(data);
        break;
      default:
        console.log("Unknown data received", data);
    }
  }

  handleFile(data: RtcFileTransfer) {
    if (this.fileInProgress === null) {
      if (data.part !== 0) {
        console.log("Invalid file starting part. Should be 0, got", data.part);
        return;
      }
      else {
        this.fileInProgress = new FileMerger(data);
      }
    }

    clearTimeout(this.receiveExpectationTimeout);
    this.receiveExpectationTimeout = setTimeout(() => {
      this.send({type:'report', code:'PART_TIMEOUT', data: data.transferId});
      this.receiveExpectationTimeout = setTimeout(() => {
        this.send({type:'report', code:'TRANSFER_ABORTED_TIMEOUT', data: data.transferId})
      }, 400)
    }, 400)

    try {
      console.log("Collecting data", data.fileName, data.part);
      this.fileInProgress.collect(data);
      if (this.fileInProgress.finished) {
        console.log("is finished")
        let storagePath;
        if (data.metadata.type === "localizationFile") {
          storagePath = LocalizationDataUtil.getFilePath(data);
        }

        if (!storagePath) {
          console.log("Could not identify filetype, cannot store");
          this.fileInProgress = null;
          return;
        }

        console.log("Storing file", storagePath)
        FileUtil.store(storagePath, this.fileInProgress.data, {encoding: data.encoding || 'utf8'});
        this.fileInProgress = null;
        this.send({type:'report', code:'RECEIVED_FINISHED', data: data.transferId})
        clearTimeout(this.receiveExpectationTimeout);

        if (LocalizationDataUtil.isFingerprint(data)) {
          LocalizationDataUtil.compareAndStoreFingerprint(storagePath, data);
        }

      }
      else {
        this.send({type:'report', code:'RECEIVED', data: data.transferId})
      }

    }
    catch (e) {
      this.send({type:'report', code:'RECEIVED_INVALID', data: data.transferId})
      console.log("WebRtc File error", e);
      this.fileInProgress = null;
    }
  }


  send(data: RtcMessageProtocol) {
    this.connection.send(data);
  }
}