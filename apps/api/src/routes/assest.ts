import { Router } from "express";

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

assetRouter.get("/", (req, res) => {
  //   res.status(200).json({ assets: [] } as IGetAssetsResponse);
});
