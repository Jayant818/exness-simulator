import express from "express";
import cors from "cors";
import { balanceRouter } from "./routes/balance.js";
import { candlesRouter } from "./routes/candles.js";
import { orderRouter } from "./routes/orders.js";
import { authRouter } from "./routes/auth.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/balance", balanceRouter);
app.use("/api/candles", candlesRouter);
app.use("/api/orders", orderRouter);
app.use("/api/auth", authRouter);

//localhost:3002/api/auth/goggle/callback

http: app.get("/", (req, res) => {
  res.send("Http Server is running");
});

app.listen(3002, () => {
  console.log("API server running on http://localhost:3002");
});
