"use client";
import { useState } from 'react';
import { TradingInstrument } from '@repo/common';
import { Settings, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';

interface TradingPanelProps {
  selectedInstrument: TradingInstrument | null;
}

const TradingPanel = ({ selectedInstrument }: TradingPanelProps) => {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [volume, setVolume] = useState('0.01');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'closed'>('open');

  const formatPrice = (price: number) => {
    if (!selectedInstrument) return price.toFixed(2);
    return selectedInstrument.category === 'forex' 
      ? price.toFixed(5) 
      : price.toFixed(2);
  };

  const incrementVolume = () => {
    setVolume((prev) => (parseFloat(prev) + 0.01).toFixed(2));
  };

  const decrementVolume = () => {
    setVolume((prev) => Math.max(0.01, parseFloat(prev) - 0.01).toFixed(2));
  };

  return (
    <div className="w-96 bg-[#141920] border-l border-[#2a3441] flex flex-col h-full">
      {/* Current Price Display */}
      <div className="p-6 border-b border-[#2a3441]">
        <div className="text-center mb-6">
          <div className="text-white text-3xl font-mono font-bold mb-2">
            {selectedInstrument ? formatPrice(selectedInstrument.price) : '3,400.000'}
          </div>
          <div className="text-gray-400 text-sm font-medium">
            {selectedInstrument?.symbol || 'XAU/USD'}
          </div>
          <div className={`text-sm font-medium mt-1 ${selectedInstrument?.change && selectedInstrument.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {selectedInstrument?.change && selectedInstrument.change >= 0 ? '+' : ''}
            {selectedInstrument?.changePercent?.toFixed(2) || '+0.25'}%
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown size={16} className="text-red-400 mr-1" />
              <span className="text-red-400 text-xs font-medium">SELL</span>
            </div>
            <div className="text-red-400 text-lg font-mono font-bold">
              {selectedInstrument ? formatPrice(selectedInstrument.bid) : '3,395.255'}
            </div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp size={16} className="text-green-400 mr-1" />
              <span className="text-green-400 text-xs font-medium">BUY</span>
            </div>
            <div className="text-green-400 text-lg font-mono font-bold">
              {selectedInstrument ? formatPrice(selectedInstrument.ask) : '3,396.061'}
            </div>
          </div>
        </div>
      </div>

      {/* Order Form */}
      <div className="p-6 border-b border-[#2a3441]">
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setOrderType('buy')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              orderType === 'buy' 
                ? 'bg-green-500 text-white' 
                : 'bg-[#1a1f26] border border-[#2a3441] text-gray-400 hover:text-white'
            }`}
          >
            Market Buy
          </button>
          <button
            onClick={() => setOrderType('sell')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              orderType === 'sell' 
                ? 'bg-red-500 text-white' 
                : 'bg-[#1a1f26] border border-[#2a3441] text-gray-400 hover:text-white'
            }`}
          >
            Market Sell
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block font-medium">Volume (Lots)</label>
            <div className="flex items-center space-x-2">
              <button 
                onClick={decrementVolume}
                className="w-8 h-8 bg-[#1a1f26] border border-[#2a3441] rounded text-gray-400 hover:text-white hover:border-[#ff6b00] transition-colors flex items-center justify-center"
              >
                <Minus size={14} />
              </button>
              <input
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="flex-1 bg-[#1a1f26] border border-[#2a3441] rounded-lg px-3 py-2 text-white text-center font-mono focus:outline-none focus:border-[#ff6b00] transition-colors"
              />
              <button 
                onClick={incrementVolume}
                className="w-8 h-8 bg-[#1a1f26] border border-[#2a3441] rounded text-gray-400 hover:text-white hover:border-[#ff6b00] transition-colors flex items-center justify-center"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block font-medium">Take Profit</label>
            <input
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="Not set"
              className="w-full bg-[#1a1f26] border border-[#2a3441] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#ff6b00] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block font-medium">Stop Loss</label>
            <input
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Not set"
              className="w-full bg-[#1a1f26] border border-[#2a3441] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#ff6b00] transition-colors"
            />
          </div>

          <div className="bg-[#1a1f26] rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-400 font-medium mb-2">Order Details</div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Margin Required:</span>
              <span className="text-white font-mono">16.98 USD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Leverage:</span>
              <span className="text-white font-mono">1:200</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Spread:</span>
              <span className="text-white font-mono">0.8 pts</span>
            </div>
          </div>

          <button
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
              orderType === 'buy' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
            onClick={() => console.log(`${orderType.toUpperCase()} order placed`)}
          >
            {orderType === 'buy' ? 'BUY' : 'SELL'} {volume} lots
          </button>
        </div>
      </div>

      {/* Positions/Orders Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a3441]">
          <div className="flex space-x-6">
            {['open', 'pending', 'closed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`text-sm capitalize transition-colors ${
                  activeTab === tab 
                    ? 'text-[#ff6b00] border-b-2 border-[#ff6b00] pb-1 font-medium' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Settings size={16} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#1a1f26] rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-gray-400 text-sm mb-2">No {activeTab} positions</div>
            <div className="text-gray-500 text-xs">Your {activeTab} trades will appear here</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPanel;