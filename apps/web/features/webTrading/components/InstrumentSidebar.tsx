"use client";
import {  useEffect, useState, useRef } from 'react';
import { Search, Star } from 'lucide-react';
import { TradingInstrument } from '@repo/common';
import axios from 'axios';
import { WsManager } from '../../../lib/WsManager';

interface WsTradeData{
  data: {
    buy: number;
    market: string;
    sell: number;
    time: number;
  },
  market: string;
  type: "TRADE";
}

interface InstrumentSidebarProps {
  selectedInstrument: TradingInstrument ;
  onSelectInstrument: (instrument: TradingInstrument) => void;
  assets: TradingInstrument[];
}

const InstrumentSidebar = ({ selectedInstrument, onSelectInstrument, assets: fetchAssets }: InstrumentSidebarProps) => {

  const [searchTerm, setSearchTerm] = useState('');
  // const [activeTab, setActiveTab] = useState('all');
  const [assets, setAssets] = useState<TradingInstrument[]>(fetchAssets);
  const selectedInstrumentRef = useRef(selectedInstrument);

  useEffect(() => {
    selectedInstrumentRef.current = selectedInstrument;
  }, [selectedInstrument]);

  useEffect(() => {
    async function fetchAndSubscribe() {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/assets`);
        const initialAssets: TradingInstrument[] = res.data.assets;
        setAssets(initialAssets);
        // setInitialPrice(initialAssets);

        const wsInstance = WsManager.getInstance();
 
        wsInstance.registerCallback('trade', (data: WsTradeData) => {
          // updatePrice(data.market, data.data.buy, data.data.sell);

          setAssets(prevAssets => 
            // Map over the previous assets array
            prevAssets.map(asset => {
              // Check if the current asset's symbol matches the market from the WebSocket data
              if (asset.symbol.toLowerCase() === data.market) {
                // If it matches, return a new object with the updated prices
                return {
                  ...asset,
                  buyPrice: String(data.data.buy),
                  sellPrice: String(data.data.sell),
                };
              }
              // If it doesn't match, return the asset unchanged
              return asset;
            })
          );

          const currentSelectedInstrument = selectedInstrumentRef.current;
          if (currentSelectedInstrument && currentSelectedInstrument.symbol.toLowerCase() === data.market) {
            onSelectInstrument({
              ...currentSelectedInstrument,
              buyPrice: String(data.data.buy),
              sellPrice: String(data.data.sell),
            });
          }
        }, 'all-trades');

      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    }

    fetchAndSubscribe();

    return () => {
      const wsInstance = WsManager.getInstance();
      wsInstance.deRegisterCallback('trade', 'all-trades');
    };
  }, [onSelectInstrument]);

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