"use client";
import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { TradingInstrument } from '@repo/common';
import { Settings, HelpCircle, MoreHorizontal, X } from 'lucide-react';

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

  return (
    <div className="w-96 bg-trading-bg-secondary border-l border-trading-border flex flex-col h-full">
      {/* Current Price Display */}
      <div className="p-4 border-b border-trading-border">
        <div className="text-center mb-4">
          <div className="text-trading-text-primary text-2xl font-mono mb-1">
            {selectedInstrument ? formatPrice(selectedInstrument.price) : '3,400.000'}
          </div>
          <div className="text-trading-text-secondary text-sm">
            {selectedInstrument?.symbol || 'XAU/USD'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-trading-danger-bg border border-trading-danger rounded p-3 text-center">
            <div className="text-trading-danger text-lg font-mono">
              {selectedInstrument ? formatPrice(selectedInstrument.bid) : '3,395.255'}
            </div>
            <div className="text-trading-text-secondary text-xs mt-1">5.73°</div>
          </div>
          <div className="bg-trading-success-bg border border-trading-success rounded p-3 text-center">
            <div className="text-trading-success text-lg font-mono">
              {selectedInstrument ? formatPrice(selectedInstrument.ask) : '3,396.061'}
            </div>
            <div className="text-trading-text-secondary text-xs mt-1">4.13%</div>
          </div>
        </div>
      </div>

      {/* Order Form */}
      <div className="p-4 border-b border-trading-border">
        <div className="flex space-x-1 mb-4">
          <Button
            variant={orderType === 'buy' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setOrderType('buy')}
            className={`flex-1 ${orderType === 'buy' ? 'bg-trading-success hover:bg-trading-success text-white' : 'text-trading-text-secondary'}`}
          >
            Market
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-trading-text-secondary"
          >
            Pending
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-trading-text-secondary mb-1 block">Volume</label>
            <div className="flex items-center space-x-2">
              <input
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="flex-1 bg-trading-bg-tertiary border-trading-border text-trading-text-primary"
              />
              <span className="text-xs text-trading-text-secondary">Lots</span>
              <div className="flex space-x-1">
                <button className="text-trading-text-muted hover:text-trading-text-secondary">-</button>
                <button className="text-trading-text-muted hover:text-trading-text-secondary">+</button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-trading-text-secondary mb-1 block">Take Profit</label>
            <div className="flex items-center space-x-2">
              <input
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Not set"
                className="flex-1 bg-trading-bg-tertiary border-trading-border text-trading-text-primary"
              />
              <span className="text-xs text-trading-text-secondary">Price</span>
              <div className="flex space-x-1">
                <button className="text-trading-text-muted hover:text-trading-text-secondary">-</button>
                <button className="text-trading-text-muted hover:text-trading-text-secondary">+</button>
              </div>
              <button className="text-trading-text-muted hover:text-trading-text-secondary">
                <HelpCircle size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-trading-text-secondary mb-1 block">Stop Loss</label>
            <div className="flex items-center space-x-2">
              <input
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Not set"
                className="flex-1 bg-trading-bg-tertiary border-trading-border text-trading-text-primary"
              />
              <span className="text-xs text-trading-text-secondary">Price</span>
              <div className="flex space-x-1">
                <button className="text-trading-text-muted hover:text-trading-text-secondary">-</button>
                <button className="text-trading-text-muted hover:text-trading-text-secondary">+</button>
              </div>
              <button className="text-trading-text-muted hover:text-trading-text-secondary">
                <HelpCircle size={16} />
              </button>
            </div>
          </div>

          <div className="text-xs text-trading-text-secondary space-y-1">
            <div className="flex justify-between">
              <span>Fees:</span>
              <span>- 0.16 USD</span>
            </div>
            <div className="flex justify-between">
              <span>Leverage:</span>
              <span>1:200</span>
            </div>
            <div className="flex justify-between">
              <span>Margin:</span>
              <span>16.98 USD</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button 
              className="bg-trading-danger hover:bg-red-700 text-white font-medium"
              onClick={() => console.log('Sell order placed')}
            >
              Confirm Sell 0.01 lots
            </Button>
            <Button 
              className="bg-trading-success hover:bg-green-700 text-white font-medium"
              onClick={() => console.log('Buy order placed')}
            >
              Confirm Buy 0.01 lots  
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="w-full text-trading-text-secondary text-xs">
            Cancel
          </Button>
        </div>
      </div>

      {/* Positions/Orders Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-trading-border">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('open')}
              className={`text-sm ${activeTab === 'open' ? 'text-trading-text-primary border-b-2 border-trading-blue pb-1' : 'text-trading-text-secondary'}`}
            >
              Open
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`text-sm ${activeTab === 'pending' ? 'text-trading-text-primary border-b-2 border-trading-blue pb-1' : 'text-trading-text-secondary'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`text-sm ${activeTab === 'closed' ? 'text-trading-text-primary border-b-2 border-trading-blue pb-1' : 'text-trading-text-secondary'}`}
            >
              Closed
            </button>
          </div>
          <div className="flex space-x-2">
            <button className="text-trading-text-muted hover:text-trading-text-secondary">
              <MoreHorizontal size={16} />
            </button>
            <button className="text-trading-text-muted hover:text-trading-text-secondary">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-trading-text-muted mb-2">📋</div>
            <div className="text-trading-text-secondary text-sm">No open positions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPanel;