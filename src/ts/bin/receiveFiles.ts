import {WebRtcServer} from "../rtc/WebRtcServer";


const connectionToken = "3fuehb-anw48GDAgniubrsj80ghbnfjdpj-fjwvrhbnlzvknkshno478";

let server = new WebRtcServer(connectionToken);
server.start();