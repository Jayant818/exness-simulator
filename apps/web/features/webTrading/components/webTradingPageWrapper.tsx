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
    <div className="bg-trading-bg-primary text-trading-text-primary flex flex-col">
      {/* <TradingHeader /> */}
      
      <div className="flex-1 flex overflow-hidden">
        <InstrumentSidebar 
          selectedInstrument={selectedInstrument}
          onSelectInstrument={setSelectedInstrument}
        />
        
        <TradeChart market="BTCUSDT" />
        <TradingPanel selectedInstrument={selectedInstrument} />
      </div>
    </div>
  );
};

export default WebTradingPageWrapper;