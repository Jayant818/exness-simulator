export type MessageToSend = {
  type: "candles";
  data: {
    market: string;
  };
};
