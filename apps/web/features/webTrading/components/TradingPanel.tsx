"use client";
import { useEffect, useState } from 'react';
import { TradingInstrument } from '@repo/common';
import { Settings, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';

interface TradingPanelProps {
  selectedInstrument: TradingInstrument | null;
}

const TradingPanel = ({ selectedInstrument }: TradingPanelProps) => {
  const { balance, fetchBalance } = useAuth();
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [volume, setVolume] = useState('0.01');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'closed'>('open');
  const [leverage, setLeverage] = useState(1);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [closedOrders, setClosedOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOpenOrders = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/trade/open`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          console.log('Fetched orders:', data);
          setOpenOrders(data.orders);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      }
    }

    const fetchClosedOrders = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/trade/closed`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          console.log('Fetched closed orders:', data);
          setClosedOrders(data.orders);
        }
      }

      catch (err) {
        console.error('Error fetching closed orders:', err);
      }
    }

    fetchOpenOrders();
    fetchClosedOrders();
  },[])

  const formatPrice = (price: number) => {
  // if (!selectedInstrument) return price.toFixed(3);
  //   return selectedInstrument.category === 'forex'
  //     ? price.toFixed(5)
  //     : price.toFixed(2)
    // ;
    
    return price.toFixed(3);
  };

  const incrementVolume = () => {
    setVolume((prev) => (parseFloat(prev) + 0.01).toFixed(2));
  };

  const decrementVolume = () => {
    setVolume((prev) => Math.max(0.01, parseFloat(prev) - 0.01).toFixed(2));
  };

  const marginRequired = orderType === 'buy' ?
      selectedInstrument ?  Number(selectedInstrument.buyPrice) * parseFloat(volume) / leverage : 0
    : selectedInstrument ? Number(selectedInstrument.sellPrice) * parseFloat(volume) / leverage : 0;
  
  const handlePlaceOrder = async() => {
    console.log("Placing order", {
      type: "market",
      side: orderType,
      leverage: leverage,
      QTY: parseFloat(volume),
      TP: orderType === 'buy' ? parseFloat(takeProfit) : undefined,
      SL: orderType === 'buy' ? parseFloat(stopLoss) : undefined,
      market: selectedInstrument?.symbol || '',
    });

    try {
      const data = {
        type: "market",
        side: orderType,
        leverage: leverage,
        QTY: parseFloat(volume),
        TP: orderType === 'buy' ? parseFloat(takeProfit) : undefined,
        SL: orderType === 'buy' ? parseFloat(stopLoss) : undefined,
        market: selectedInstrument?.symbol || '',
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const result = await res.json();
        console.log('Order placed successfully:', result);
        // Optionally, reset form fields or provide user feedback here
        setVolume('0.01');
        setTakeProfit('');
        setStopLoss('');
        setOpenOrders(prev => [...prev, { ...data , TP: data.TP ? data.TP * 100 : undefined, SL: data.SL ? data.SL * 100 : undefined }]);

        await fetchBalance();
        
      }
    } catch (err) {
      console.error('Error placing order:', err);
    }
  }


  return (
    <div className="w-96 bg-[#141920] border-l border-[#2a3441] flex flex-col h-full">
      {/* Current Price Display */}
      <div className="p-6 border-b border-[#2a3441]">
        <div className="text-center mb-6">
          {/* <div className="text-white text-3xl font-mono font-bold mb-2">
            {selectedInstrument ? formatPrice(Number(selectedInstrument.buyPrice)) : '3,400.000'}
          </div> */}
          <div className="text-gray-400 text-sm font-medium">
            {selectedInstrument?.symbol || 'XAU/USD'}
          </div>
          {/* <div className={`text-sm font-medium mt-1 ${selectedInstrument?.change && selectedInstrument.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {selectedInstrument?.change && selectedInstrument.change >= 0 ? '+' : ''}
            {selectedInstrument?.changePercent?.toFixed(2) || '+0.25'}%
          </div> */}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown size={16} className="text-red-400 mr-1" />
              <span className="text-red-400 text-xs font-medium">SELL</span>
            </div>
            <div className="text-red-400 text-lg font-mono font-bold">
              {selectedInstrument ? formatPrice(Number(selectedInstrument.sellPrice)) : '3,395.255'}
            </div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp size={16} className="text-green-400 mr-1" />
              <span className="text-green-400 text-xs font-medium">BUY</span>
            </div>
            <div className="text-green-400 text-lg font-mono font-bold">
              {selectedInstrument ? formatPrice(Number(selectedInstrument.buyPrice)) : '3,396.061'}
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
            {/* {selectedInstrument && takeProfit && orderType === 'buy' && Number(takeProfit) < Number(selectedInstrument.sellPrice) && <div className="text-red-500 text-xs mt-1">Min {selectedInstrument.sellPrice}</div>}
            {selectedInstrument && takeProfit && orderType === 'sell' && Number(takeProfit) < Number(selectedInstrument.buyPrice) && <div className="text-red-500 text-xs mt-1">Take Profit should be more than {selectedInstrument.buyPrice}</div>} */}
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block font-medium">Stop Loss</label>
            <input
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Not set"
              className="w-full bg-[#1a1f26] border border-[#2a3441] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#ff6b00] transition-colors"
            />
            {/* {selectedInstrument && stopLoss && orderType === "buy" && Number(stopLoss) > Number(selectedInstrument.sellPrice) && <div className="text-red-500 text-xs mt-1">Max {selectedInstrument.sellPrice}</div>}
            {selectedInstrument && stopLoss && orderType === "sell" && Number(stopLoss) > Number(selectedInstrument.buyPrice) && <div className="text-red-500 text-xs mt-1">Stop Loss should be less than {selectedInstrument.buyPrice}</div>} */}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400 font-medium">Leverage</label>
              <span className="text-xs text-white font-mono bg-[#2a3441] px-2 py-1 rounded">1:{leverage}</span>
            </div>
            <input
              type='range'
              min="1"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              max="40"
              className="w-full custom-range"
            />
          </div>

          <div className="bg-[#1a1f26] rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-400 font-medium mb-2">Order Details</div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Margin Required:</span>
              <span className="text-white font-mono">{marginRequired.toFixed(2)} USD</span>
            </div>
            {/* <div className="flex justify-between text-xs">
              <span className="text-gray-400">Leverage:</span>
              <span className="text-white font-mono">1:200</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Spread:</span>
              <span className="text-white font-mono">0.8 pts</span>
            </div> */}
          </div>

          <button
            className={`w-full py-3 rounded-lg font-bold text-white disabled:bg-gray-600 transition-colors ${
              orderType === 'buy' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
              }`}
              disabled={
                !selectedInstrument ||
                marginRequired > (balance/100) 
                // (
                //   orderType === "buy" &&
                //   (
                //     (!!takeProfit && Number(takeProfit) <= Number(selectedInstrument.buyPrice)) ||
                //     (!!stopLoss && Number(stopLoss) > Number(selectedInstrument.buyPrice))
                //   )
                // ) ||
                // (
                //   orderType === "sell" &&
                //   (
                //     (!!takeProfit && Number(takeProfit) >= Number(selectedInstrument.sellPrice)) ||
                //     (!!stopLoss && Number(stopLoss) <= Number(selectedInstrument.sellPrice))
                //   )
                // )
              }
              
            onClick={handlePlaceOrder}
          >
            {orderType === 'buy' ? 'BUY' : 'SELL'} {volume} lots
          </button>
        </div>
      </div>

      {/* Positions/Orders Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a3441]">
          <div className="flex space-x-6">
            {['open', 'closed'].map((tab) => (
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
        </div>

        {activeTab === 'open' ? (
          openOrders.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              {openOrders.map((order, index) => {
                if (!order) return null;
                return(
                <div
                  key={index}
                  className="p-4 border-b border-[#2a3441] hover:bg-[#1a1f26] transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-white font-mono font-bold">
                      {order?.side?.toUpperCase()} {order.QTY} lots
                    </div>
                    <div className={`text-sm font-mono font-bold ${order?.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {order?.side === 'buy' ? '+' : '-'}{selectedInstrument ? formatPrice(Number(selectedInstrument?.buyPrice) / 100) : '0.000'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">Market: {order?.market}</div>
                  <div className="text-xs text-gray-400">TP: {Number(order?.TP)/100 || 'N/A'} | SL: {Number(order?.SL)/100 || 'N/A'}</div>
            </div>
          )
})}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1a1f26] rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">📂</span>
                </div>
                <div className="text-gray-400 text-sm mb-2">No open positions</div>
                <div className="text-gray-500 text-xs">Your open trades will appear here</div>
              </div>
            </div>
            
          )) : (
            closedOrders.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
                {closedOrders.map((order, index) => {
                  if (!order) return null;
                return(
                <div
                    key={index}
                    className="p-4 border-b border-[#2a3441] hover:bg-[#1a1f26] transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-white font-mono font-bold">
                        {order?.side.toUpperCase()} {order.QTY} lots
                      </div>
                      <div className={`text-sm font-mono font-bold ${order?.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {order?.side === 'buy' ? '+' : '-'}{selectedInstrument ? formatPrice(Number(selectedInstrument.buyPrice)/100) : '0.000'}
                    </div>
                  </div>
                  <div className="text-xs
                    text-gray-400 mb-1">Market: {order?.market}</div>
                  <div className="text-xs text-gray-400">TP: {order?.TP || 'N/A'} | SL: {order?.SL || 'N/A'}</div>
                  </div>
                )
})}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1a1f26] rounded-full flex items-center justify-center mb-4 mx-auto">
                      <span className="text-2xl">📂</span>
                    </div>
                    <div className="text-gray-400 text-sm mb-2">No closed positions</div>
                    <div className="text-gray-500 text-xs">Your closed trades will appear here</div>
                  </div>
                </div>
              )
            
        )}
      </div>
    </div>
  );
};

export default TradingPanel;