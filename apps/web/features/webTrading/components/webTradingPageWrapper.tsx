"use client";
import { useEffect, useState } from 'react';

import { TradingInstrument } from '@repo/common';
import TradingHeader from './TradingHeader';
import InstrumentSidebar from './InstrumentSidebar';
import TradeChart from './tradeView';
import TradingPanel from './TradingPanel';
import { WsManager } from '../../../lib/WsManager';
import { useAuth } from '../../../lib/AuthContext';
import { withAuth } from '../../../components/shared/withAuth';


const WebTradingPageWrapper = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<TradingInstrument | null>(null);
  const [assets, setAssets] = useState<TradingInstrument[]>([]);
  // const { isAuthenticated } = useAuth();

  useEffect(() => {

    fetchAssets();
    const wsInstance = WsManager.getInstance();
    wsInstance.sendMessage({
      type: "IDENTIFY",
      userId: "abcd"
    })
  },[])
  
  // if (!isAuthenticated && window) { 
  //   window.location.href = '/login';
  //   return;
  // }
  


async function fetchAssets() { 
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/assets`);
  const data = await res.json();
 
  

  setSelectedInstrument(data.assets[0]);

  const wsInstance = WsManager.getInstance();

  data.assets.forEach((asset: TradingInstrument) => {
    wsInstance.subscribe(asset.symbol.toLowerCase(), "abcd");
  });

  setAssets(data.assets);
}
  

  return (
    <div className="trading-layout flex flex-col ">
      {/* <TradingHeader /> */}
      
      <div className="flex-1 flex overflow-hidden">
        <InstrumentSidebar 
          assets={assets}
          // @ts-ignore
          selectedInstrument={selectedInstrument}
          onSelectInstrument={setSelectedInstrument}
        />
        
        <div className="flex-1 flex flex-col">
          <TradeChart market={selectedInstrument?.symbol || "BTCUSDT"} />
        </div>
        
        <TradingPanel selectedInstrument={selectedInstrument} />
      </div>
    </div>
  );
};

export default withAuth(WebTradingPageWrapper);