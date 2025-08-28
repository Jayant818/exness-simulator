"use client";
import { useEffect } from "react";
import HeroSection from "../components/Home/Hero";
import TradeView from "../features/webTrading/components/tradeView";

export default function Home() {

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("WebSocket connection established");

      // Identify the user (you can replace 'user123' with a dynamic user ID)
      ws.send(JSON.stringify({ type: "IDENTIFY", userId: "user123" }));

      // Subscribe to a market (e.g., BTCUSDT trades)
      ws.send(
        JSON.stringify({ type: "SUBSCRIBE", market: "btcusdt@trade" })
      );
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received data:", data);
      // Handle incoming trade data here
    };
  
  }, [])

  return (
    <>
      <HeroSection />
      <h1>HELLO</h1>
      <TradeView market="BTCUSDT" />
      
    </>
  );
}
