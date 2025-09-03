import express from "express";
import cors from "cors";
import { balanceRouter } from "./routes/balance.js";
import { candlesRouter } from "./routes/candles.js";
import { tradeRouter } from "./routes/trade.js";
import { authRouter } from "./routes/auth.js";
import { assetRouter } from "./routes/assest.js";
import startTradeListening from "./tradeListener.js";
import { systemRouter } from "./routes/system.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

startTradeListening().catch((err) => {
  console.error("Failed to start trade listener:", err);
  process.exit(1);
});

app.use("/api/candles", candlesRouter);
app.use("/api/v1/trade", tradeRouter);
app.use("/api/v1/user", authRouter);
app.use("/api/v1/assets", assetRouter);
app.use("api/v1/system", systemRouter);


//localhost:3002/api/auth/goggle/callback

app.get("/", (req, res) => {
  res.send("Http Server is running");
});

app.listen(3002, () => {
  console.log("API server running on http://localhost:3002");
});
