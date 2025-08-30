"use client";
import { useState } from 'react';

import { TradingInstrument } from '@repo/common';
import { mockInstruments } from '@repo/common';
import TradingHeader from './TradingHeader';
import InstrumentSidebar from './InstrumentSidebar';
import TradeChart from './tradeView';
import TradingPanel from './TradingPanel';

const WebTradingPageWrapper = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<TradingInstrument | null>(
    mockInstruments.find((instrument: TradingInstrument) => instrument.symbol === 'XAU/USD') || null
  );

  return (
    <div className="trading-layout flex flex-col h-screen">
      <TradingHeader />
      
      <div className="flex-1 flex overflow-hidden">
        <InstrumentSidebar 
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