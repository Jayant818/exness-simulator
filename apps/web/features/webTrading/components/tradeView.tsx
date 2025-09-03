"use client";

import React, { useEffect, useRef, useState } from 'react'
import { ChartManager } from '../../../lib/chartManager';

interface KLine{
    close: string;
    end: string;
    high: string;
    low: string;
    open: string;
    quoteVolume: string;
    start: string;
    trades: string;
    time: string;
    volume: string;
}

const TradeChart = ({ market }: { market: string }) => {
    
    const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager>(null);
  const [timeFrame, setTimeFrame] = useState('1m');

  const handleTimeFrameChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    const timeframe = (e.target as HTMLButtonElement).innerText;
    setTimeFrame(timeframe);
  }

    useEffect(() => {
        const init = async () => {
            let kLinesData: KLine[] = [];
            try {
                const data = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/candles?symbol=${market}&interval=${timeFrame}`);
                // http://localhost:3002/api/candles?symbol=ETHUSDT&interval=1m
                kLinesData = await data.json();

            } catch (err) {
                console.error("Error fetching k-lines data:", err);
                return;
            }

            console.log("Fetched k-lines data:", kLinesData);

            if (chartRef.current) {
                if (chartManagerRef.current) {
                    chartManagerRef.current.destroy();
                }

                const chartManager = new ChartManager(
                    chartRef.current, 
                    [
                        ...kLinesData
                            .map(kline => ({
                                close: parseFloat(kline.close),
                                high: parseFloat(kline.high),
                                low: parseFloat(kline.low),
                                open: parseFloat(kline.open),
                                timestamp: new Date(kline.time).getTime(),
                            }))
                            .sort((a, b) => a.timestamp - b.timestamp),
                        ],
                        {
                            background: "#0a0e13",
                            color: "#ffffff",
                        }
                );

                chartManagerRef.current = chartManager;
            }
            
        }

        
        init();
        return () => {
            if (chartManagerRef.current) {
                chartManagerRef.current.destroy();
            }
        }
    },[market,timeFrame])

  return (
    <div className="flex-1 bg-[#0a0e13] border-r border-[#2a3441] relative">
      {/* Chart Header */}
      <div className="absolute top-4 left-4 z-10 bg-[#141920]/90 backdrop-blur-sm rounded-lg p-3 border border-[#2a3441]">
        <div className="flex items-center space-x-4">
          <div className="text-white font-bold text-lg">{market}</div>
          {/* <div className="text-green-400 text-sm font-medium">+2.45%</div> */}
          <div className="text-gray-400 text-sm">{timeFrame}</div>
        </div>
      </div>
      
      {/* Chart Container */}
      <div ref={chartRef} className="w-full h-full" />
      
      {/* Chart Controls */}
      <div className="absolute  bottom-7 left-4 z-10 bg-[#141920]/90 backdrop-blur-sm rounded-lg p-2 border border-[#2a3441]">
        <div className="flex items-center space-x-2">
          {['1m', '5m', '1h', '1d'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={handleTimeFrameChange}
              className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#2a3441] rounded transition-colors"
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TradeChart;