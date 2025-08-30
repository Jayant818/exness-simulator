"use client";
import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { mockInstruments } from '@repo/common';
import { TradingInstrument } from '@repo/common';

interface InstrumentSidebarProps {
  selectedInstrument: TradingInstrument | null;
  onSelectInstrument: (instrument: TradingInstrument) => void;
}

const InstrumentSidebar = ({ selectedInstrument, onSelectInstrument }: InstrumentSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredInstruments = mockInstruments.filter(instrument =>
    instrument.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instrument.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChangeIcon = (change: number) => {
    return change >= 0 ? '▲' : '▼';
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'forex', label: 'Forex' },
    { key: 'crypto', label: 'Crypto' },
    { key: 'stocks', label: 'Stocks' }
  ];

  const getCategoryInstruments = () => {
    if (activeTab === 'all') return filteredInstruments;
    return filteredInstruments.filter(instrument => instrument.category === activeTab);
  };

  return (
    <div className="w-80 bg-[#141920] border-r border-[#2a3441] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#2a3441]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Market Watch</h2>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Star size={18} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search instruments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1f26] border border-[#2a3441] rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#ff6b00] transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 border-b border-[#2a3441]">
        <div className="flex space-x-1">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setActiveTab(category.key)}
              className={`text-sm px-3 py-1.5 rounded transition-colors ${
                activeTab === category.key 
                  ? 'bg-[#ff6b00] text-white font-medium' 
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1f26]'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="px-4 py-3 border-b border-[#2a3441] bg-[#1a1f26]">
        <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 font-medium">
          <span>Symbol</span>
          <span className="text-right">Trend</span>
          <span className="text-right">Bid</span>
          <span className="text-right">Ask</span>
        </div>
      </div>

      {/* Instruments List */}
      <div className="flex-1 overflow-y-auto trading-scrollbar">
        {getCategoryInstruments().map((instrument) => (
          <div
            key={instrument.id}
            onClick={() => onSelectInstrument(instrument)}
            className={`px-4 py-3 border-b border-[#2a3441] cursor-pointer hover:bg-[#1a1f26] transition-colors ${
              selectedInstrument?.id === instrument.id ? 'bg-[#1a1f26] border-l-2 border-l-[#ff6b00]' : ''
            }`}
          >
            <div className="grid grid-cols-4 gap-2 items-center">
              {/* Symbol */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${instrument.change >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div>
                  <div className="text-white text-sm font-medium">
                    {instrument.symbol}
                  </div>
                </div>
              </div>

              {/* Trend */}
              <div className="text-right">
                <span className={`text-sm font-bold ${instrument.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {getChangeIcon(instrument.change)}
                </span>
              </div>

              {/* Bid */}
              <div className="text-right">
                <span className="text-white text-sm font-mono">
                  {instrument.bid.toFixed(instrument.category === 'forex' ? 5 : 2)}
                </span>
              </div>

              {/* Ask */}
              <div className="text-right">
                <span className="text-white text-sm font-mono">
                  {instrument.ask.toFixed(instrument.category === 'forex' ? 5 : 2)}
                </span>
              </div>
            </div>

            {/* Additional row with change info */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div className="col-span-2">
                <span className="text-xs text-gray-400">{instrument.name}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className={`text-xs font-medium ${instrument.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {instrument.change >= 0 ? '+' : ''}{instrument.change.toFixed(instrument.category === 'forex' ? 5 : 2)}
                </span>
                <span className={`text-xs ml-2 font-medium ${instrument.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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