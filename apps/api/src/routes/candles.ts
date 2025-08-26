import { Router } from "express";

export const candlesRouter = Router();

candlesRouter.get("/", (req, res) => {
  const { asset, duration, startTime, endTime } = req.query;
});
