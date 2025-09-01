import { Router } from "express";
import PrismClient from "@repo/primary-db";
import { redis } from "@repo/shared-redis";

export const assetRouter = Router();

interface IGetAssetsResponse {
  assets: {
    name: string;
    symbol: string;
    buyPrice: number;
    sellPrice: number;
    decimals: number;
    img_url: string;
  };
}

assetRouter.get("/", async (req, res) => {
  const data = await PrismClient.prisma.asset.findMany();

  if (!data || data.length === 0) {
    return res.status(200).json({ assets: [] });
  }

  // const tradeData = await redis.hGetAll(`trade:${data.symbol.toLowerCase()}`);

  const assets = await Promise.all(
    data.map(async (asset) => {
      const tradeData = await redis.get(`trade:${asset.symbol.toLowerCase()}`);

      // console.log("Trade data for", asset.symbol.toLowerCase(), tradeData);

      if (!tradeData) {
        return;
      }

      const { buy, sell } = JSON.parse(tradeData);

      return {
        name: asset.name,
        symbol: asset.symbol,
        buyPrice: buy,
        sellPrice: sell,
        decimals: asset.decimals,
        img_url: asset.imgUrl ?? "",
      };
    })
  );

  res.status(200).json({ assets });
});
