import { TradingInstrument } from "../types/index.js";

export const POLLING_ENGINE_EVENT_CHANNEL = "polling-channel-for-events";

export const BINANCE_WS_URL = "wss://stream.binance.com:9443/stream?streams=";
//stream.binance.com:9443/stream?streams=btcusdt@trade

export const POLLING_ENGINE_DATA_CHANNEL = "polling-engine-data-channel";

export const POLLING_ENGINE_QUEUE_NAME = "polling-engine-queue";

export const MARKET_TRADE_CHANNELS = "market_trade_channels";

export const SIMULATOR_MARGIN = 5; //5% margin

export const TRADE_KEY = "trade_key";

export const mockInstruments: TradingInstrument[] = [
  {
    id: "1",
    symbol: "BTC",
    name: "Bitcoin",
    price: 111799.21,
    change: 2156.75,
    changePercent: 1.96,
    bid: 111795.21,
    ask: 111803.21,
    category: "crypto",
  },
  {
    id: "2",
    symbol: "XAU/USD",
    name: "Gold vs US Dollar",
    price: 3395.905,
    change: -4.095,
    changePercent: -0.12,
    bid: 3395.255,
    ask: 3396.555,
    category: "commodities",
  },
  {
    id: "3",
    symbol: "AAPL",
    name: "Apple Inc",
    price: 229.96,
    change: 5.12,
    changePercent: 2.28,
    bid: 229.94,
    ask: 229.98,
    category: "stocks",
  },
  {
    id: "4",
    symbol: "EUR/USD",
    name: "Euro vs US Dollar",
    price: 1.16388,
    change: -0.00012,
    changePercent: -0.01,
    bid: 1.16386,
    ask: 1.1639,
    category: "forex",
  },
  {
    id: "5",
    symbol: "GBP/USD",
    name: "British Pound vs US Dollar",
    price: 1.34959,
    change: 0.00231,
    changePercent: 0.17,
    bid: 1.34957,
    ask: 1.34961,
    category: "forex",
  },
  {
    id: "6",
    symbol: "USD/JPY",
    name: "US Dollar vs Japanese Yen",
    price: 147.445,
    change: -0.875,
    changePercent: -0.59,
    bid: 147.443,
    ask: 147.447,
    category: "forex",
  },
  {
    id: "7",
    symbol: "USTEC",
    name: "US Tech 100",
    price: 23360.35,
    change: 156.22,
    changePercent: 0.67,
    bid: 23358.35,
    ask: 23362.35,
    category: "stocks",
  },
  {
    id: "8",
    symbol: "USOIL",
    name: "US Crude Oil",
    price: 63.723,
    change: -1.277,
    changePercent: -1.96,
    bid: 63.721,
    ask: 63.725,
    category: "commodities",
  },
];
