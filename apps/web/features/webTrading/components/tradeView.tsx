"use client";

import React, { useEffect, useRef } from 'react'
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

    useEffect(() => {
        const init = async () => {
            let kLinesData: KLine[] = [];
            try {
                const data = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/candles?symbol=${market}&interval=1m`);
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

                // const chartManager = new ChartManager(
                //     chartRef.current,
                //     [
                //         ...kLinesData?.map(kline => ({
                //             close: parseFloat(kline.close),
                //             high: parseFloat(kline.high),
                //             low: parseFloat(kline.low),
                //             open: parseFloat(kline.open),
                //             timestamp: new Date(kline.end),
                //         }))
                //     ].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)) || [],
                //     {
                //         background: "#0e0f14",
                //         color: "white",
                //       }
                // )

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
                            background: "#0e0f14",
                            color: "white",
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
    },[market])

  return (
    <div ref={chartRef} style={{ width: '100%', height: '500px' }} >

    </div>
  )
}

export default TradeChart;