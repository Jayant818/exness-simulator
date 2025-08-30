"use client";
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { mockInstruments } from '@repo/common';
import { TradingInstrument } from '@repo/common';

interface InstrumentSidebarProps {
  selectedInstrument: TradingInstrument | null;
  onSelectInstrument: (instrument: TradingInstrument) => void;
}

const InstrumentSidebar = ({ selectedInstrument, onSelectInstrument }: InstrumentSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('favorites');

  const filteredInstruments = mockInstruments.filter(instrument =>
    instrument.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instrument.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChangeIcon = (change: number) => {
    return change >= 0 ? '▲' : '▼';
  };

  return (
    <div className="w-80 bg-trading-bg-secondary border-r border-trading-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-trading-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-trading-text-primary font-medium">INSTRUMENTS</h2>
          <button className="text-trading-text-muted hover:text-trading-text-secondary">
            <X size={16} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-trading-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-trading-bg-tertiary border border-trading-border rounded pl-10 pr-3 py-2 text-trading-text-primary text-sm focus:outline-none focus:border-trading-blue"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-trading-border">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`text-sm px-2 py-1 ${activeTab === 'favorites' ? 'text-trading-text-primary border-b-2 border-trading-blue' : 'text-trading-text-secondary hover:text-trading-text-primary'}`}
          >
            Favourites
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-4 py-2 border-b border-trading-border">
        <div className="grid grid-cols-4 gap-2 text-xs text-trading-text-muted">
          <span>Symbol</span>
          <span className="text-right">Signal</span>
          <span className="text-right">Bid</span>
          <span className="text-right">Ask</span>
        </div>
      </div>

      {/* Instruments List */}
      <div className="flex-1 overflow-y-auto trading-scrollbar">
        {filteredInstruments.map((instrument) => (
          <div
            key={instrument.id}
            onClick={() => onSelectInstrument(instrument)}
            className={`px-4 py-3 border-b border-trading-border cursor-pointer hover:bg-trading-bg-tertiary ${selectedInstrument?.id === instrument.id ? 'bg-trading-bg-tertiary' : ''}`}
          >
            <div className="grid grid-cols-4 gap-2 items-center">
              {/* Symbol */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${instrument.change >= 0 ? 'bg-trading-success' : 'bg-trading-danger'}`}></div>
                <div>
                  <div className="text-trading-text-primary text-sm font-medium">
                    {instrument.symbol}
                  </div>
                </div>
              </div>

              {/* Signal */}
              <div className="text-right">
                <span className={`text-sm ${instrument.change >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                  {getChangeIcon(instrument.change)}
                </span>
              </div>

              {/* Bid */}
              <div className="text-right">
                <span className="text-trading-text-primary text-sm">
                  {instrument.bid.toFixed(instrument.category === 'forex' ? 5 : 2)}
                </span>
              </div>

              {/* Ask */}
              <div className="text-right">
                <span className="text-trading-text-primary text-sm">
                  {instrument.ask.toFixed(instrument.category === 'forex' ? 5 : 2)}
                </span>
              </div>
            </div>

            {/* Additional row with change info */}
            <div className="grid grid-cols-4 gap-2 mt-1">
              <div className="col-span-2">
                <span className="text-xs text-trading-text-muted">{instrument.name}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className={`text-xs ${instrument.change >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                  {instrument.change >= 0 ? '+' : ''}{instrument.change.toFixed(instrument.category === 'forex' ? 5 : 2)}
                </span>
                <span className={`text-xs ml-2 ${instrument.change >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                  ({instrument.change >= 0 ? '+' : ''}{instrument.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstrumentSidebar;