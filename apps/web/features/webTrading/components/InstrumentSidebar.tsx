"use client";
import { useEffect, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { mockInstruments } from '@repo/common';
import { TradingInstrument } from '@repo/common';
import axios from 'axios';

interface InstrumentSidebarProps {
  selectedInstrument: TradingInstrument | null;
  onSelectInstrument: (instrument: TradingInstrument) => void;
}

const InstrumentSidebar = ({ selectedInstrument, onSelectInstrument }: InstrumentSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  // const [activeTab, setActiveTab] = useState('all');
  const [assets, setAssets] = useState<TradingInstrument[]>([]);


  // const filteredInstruments = mockInstruments.filter(instrument =>
  //   instrument.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   instrument.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  const getChangeIcon = (change: number) => {
    return change >= 0 ? '▲' : '▼';
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'forex', label: 'Forex' },
    { key: 'crypto', label: 'Crypto' },
    { key: 'stocks', label: 'Stocks' }
  ];

  // const getCategoryInstruments = () => {
  //   if (activeTab === 'all') return filteredInstruments;
  //   return filteredInstruments.filter(instrument => instrument.category === activeTab);
  // };
  async function fetchAssets() { 

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/assets`);
      console.log(res.data);
      setAssets(res.data.assets);

    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  }

  useEffect(() => {
    fetchAssets();
  },[])

  const getCategoryInstruments = () => [];

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
      {/* <div className="px-4 py-3 border-b border-[#2a3441]">
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
      </div> */}

      {/* Table Header */}
{/* Table Header */}
<div className="px-4 py-3 ">
  <table className="w-full text-xs text-gray-400 font-medium">
    <thead>
      <tr className="border-b border-[#2a3441]">
        <th className="text-left py-2">Symbol</th>
        <th className="text-right py-2">Bid</th>
        <th className="text-right py-2">Ask</th>
      </tr>
    </thead>
  </table>
</div>

{/* Instruments List */}
<div className="flex-1 overflow-y-auto trading-scrollbar">
  <table className="w-full text-sm">
    <tbody>
      {assets?.map((instrument) => (
        <tr
          key={instrument.symbol}
          onClick={() => onSelectInstrument(instrument)}
          className={`cursor-pointer hover:bg-[#1a1f26] transition-colors ${
            selectedInstrument?.symbol === instrument.symbol
              ? 'bg-[#1a1f26] border-l-2 border-l-[#ff6b00]'
              : ''
          }`}
        >
          {/* Symbol */}
          <td className="px-4 py-3 text-white font-medium">
            {instrument.symbol}
          </td>

          {/* Bid */}
          <td className="px-4 py-3 text-right text-green-400 font-mono">
            {Number(instrument.buyPrice).toFixed(instrument.decimals)}
          </td>

          {/* Ask */}
          <td className="px-4 py-3 text-right text-red-400 font-mono">
            {Number(instrument.sellPrice).toFixed(instrument.decimals)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

    </div>
  );
};

export default InstrumentSidebar;