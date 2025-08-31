export class WsManager {
  private static instance: WsManager;
  private ws: WebSocket;
  private bufferedMessages: any[] = [];
  private id: number;
  private callbacks: any = {};
  private initialized = false;
  private subscribedMarkets: Set<string> = new Set(); // ✅ track subscribed symbols

  private constructor() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_SERVER;
    if (!wsUrl) throw new Error("WebSocket URL is not defined");
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.init();
  }

  public static getInstance(): WsManager {
    if (!WsManager.instance) {
      WsManager.instance = new WsManager();
    }
    return WsManager.instance;
  }

  init() {
    this.ws.onopen = () => {
      this.initialized = true;
      this.bufferedMessages.forEach((msg) => this.ws.send(JSON.stringify(msg)));
      this.bufferedMessages = [];
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const type: string = message.type
        ? message.type.toLowerCase()
        : "unknown";
      if (this.callbacks[type]) {
        this.callbacks[type].forEach((cb: any) => cb.callback(message));
      }
    };
  }

  sendMessage(message: any) {
    const msgToSend = { ...message, id: this.id++ };
    if (!this.initialized) {
      this.bufferedMessages.push(msgToSend);
      return;
    }
    this.ws.send(JSON.stringify(msgToSend));
  }

  // ✅ safe subscribe
  subscribe(market: string, userId: string) {
    if (this.subscribedMarkets.has(market)) return; // already subscribed
    this.subscribedMarkets.add(market);

    this.sendMessage({
      type: "SUBSCRIBE",
      market,
      userId,
    });
  }

  registerCallback(type: string, callback: any, id: string) {
    if (!this.callbacks[type]) this.callbacks[type] = [];
    this.callbacks[type].push({ callback, id });
  }

  deRegisterCallback(type: string, id: string) {
    if (this.callbacks[type]) {
      this.callbacks[type] = this.callbacks[type].filter(
        (cb: any) => cb.id !== id
      );
    }
  }
}
