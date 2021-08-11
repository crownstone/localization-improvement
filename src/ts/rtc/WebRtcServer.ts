import {Util} from "../util/Util";
import {RtcConnectionHandler} from "./WebRtcConnection";

const Peer = require('peerjs-on-node').Peer;


export class WebRtcServer {

  peer : any;
  connections = {};
  peerId : string = null;

  connectionToken : string;

  started   = false;

  constructor(connectionToken: string) {
    this.connectionToken = connectionToken;
  }

  destroy() {
    if (this.peer) {
      this.peer.disconnect();
      this.peer.destroy();
    }

    this.started = false;
    this.peer = null;
  }


  async initialize() {
    return new Promise<void>((resolve, reject) => {
      console.log("Creating new server with token", this.connectionToken);
      this.peer = new Peer(this.connectionToken);
      this.peer.on('error', (err) => {
        this.destroy();
        reject(err);
      });
      this.peer.on('open', (peerId) => {
        console.log("Ready to receive connections!")
        this.peerId = peerId;
        this.started = true;

        resolve();
      });
    })
  }

  async start() {
    if (!this.connectionToken) { throw new Error("NO_TOKEN"); }
    if (!this.started)         { await this.initialize(); }

    this.listen()
  }

  async listen() {
    this.peer.on('connection', (connection) => {
      console.log('Establishing connection...');
      let uuid = Util.getUUID()
      this.connections[uuid] = new RtcConnectionHandler(connection, () => { this._removeConnection(uuid) });
    });
  }

  _removeConnection(uuid: string) {
    delete this.connections[uuid];
  }
}





