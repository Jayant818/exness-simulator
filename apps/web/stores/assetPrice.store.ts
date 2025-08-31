import { create } from "zustand";
import { TradingInstrument } from "../../../common/dist/types";

interface PriceState {
  prices: Map<string, { buyPrice: number; sellPrice: number }>;
  setInitialPrice: (assets: TradingInstrument[]) => void;
  updatePrice: (market: string, buyPrice: number, sellPrice: number) => void;
}

// set function merges state
export const usePriceStore = create<PriceState>((set) => ({
  prices: new Map(),
  setInitialPrice: (assets) =>
    set(() => {
      const priceMap = new Map();
      assets.forEach((asset) => {
        priceMap.set(asset.symbol, {
          buyPrice: asset.buyPrice,
          sellPrice: asset.sellPrice,
        });
      });
      return { prices: priceMap };
    }),
  updatePrice: (market, buyPrice, sellPrice) =>
    set((state) => {
      const newPrice = new Map(state.prices);
      newPrice.set(market, { buyPrice, sellPrice });
      return { prices: newPrice };
    }),
}));
