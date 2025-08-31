"use client";
import { useEffect, useState } from 'react';

import { TradingInstrument } from '@repo/common';
import TradingHeader from './TradingHeader';
import InstrumentSidebar from './InstrumentSidebar';
import TradeChart from './tradeView';
import TradingPanel from './TradingPanel';
import { WsManager } from '../../../lib/WsManager';


const WebTradingPageWrapper = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<TradingInstrument | null>(null);
  const [assets, setAssets] = useState<TradingInstrument[]>([]);


async function fetchAssets() { 
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/assets`);
  const data = await res.json();

  const wsInstance = WsManager.getInstance();

  data.assets.forEach((asset: TradingInstrument) => {
    wsInstance.subscribe(asset.symbol.toLowerCase(), "abcd");
  });

  setAssets(data.assets);
}
  
  useEffect(() => {

    fetchAssets();
    const wsInstance = WsManager.getInstance();
    wsInstance.sendMessage({
      type: "IDENTIFY",
      userId: "abcd"
    })
  },[])
  return (
    <div className="trading-layout flex flex-col h-screen">
      <TradingHeader />
      
      <div className="flex-1 flex overflow-hidden">
        <InstrumentSidebar 
          assets={assets}
          selectedInstrument={selectedInstrument}
          onSelectInstrument={setSelectedInstrument}
        />
        
        <div className="flex-1 flex flex-col">
          <TradeChart market="BTCUSDT" />
        </div>
        
        <TradingPanel selectedInstrument={selectedInstrument} />
      </div>
    </div>
  );
};

export default WebTradingPageWrapper;