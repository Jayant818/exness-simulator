export interface TradingInstrument {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  volume?: number;
  category: "crypto" | "forex" | "stocks" | "commodities";
}
