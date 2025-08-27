import { WebSocket as WsWebSocket } from "ws";

export class User {
  public id: string;
  public ws: WsWebSocket;

  constructor(id: string, ws: WsWebSocket) {
    this.id = id;
    this.ws = ws;
  }

  public emit(message: any) {
    this.ws.send(JSON.stringify(message));
  }
}
