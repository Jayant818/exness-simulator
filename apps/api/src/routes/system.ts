import { Router } from "express";

import { restartPolling } from "@repo/shared-redis/pollingStarter";

export const systemRouter = Router();

systemRouter.post("/restart-polling", async (req, res) => {
  try {
    const result = await restartPolling();
    res.status(200).json({ message: "Polling restarted successfully", result });
  } catch (err) {
    console.error("Error restarting polling:", err);
    res.status(500).json({ message: "Failed to restart polling" });
  }
});
