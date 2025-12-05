import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function TradingChart({ signal }) {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chart = null;
    
    try {
      // Parse entry price
      let entryPrice = 2000;
      if (typeof signal.entry === 'string') {
        const parts = signal.entry.split('-');
        if (parts.length > 1) {
          entryPrice = (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
        } else {
          entryPrice = parseFloat(signal.entry.replace(/[^0-9.]/g, ''));
        }
      } else {
        entryPrice = parseFloat(signal.entry);
      }
      if (isNaN(entryPrice)) entryPrice = 2000;

      // Create chart
      chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 350,
        layout: {
          background: { color: '#000000' },
          textColor: '#888888',
        },
        grid: {
          vertLines: { color: '#1a1a1a' },
          horzLines: { color: '#1a1a1a' },
        },
        rightPriceScale: {
          borderColor: '#2a2e39',
        },
        timeScale: {
          borderColor: '#2a2e39',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // Create candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      // Generate realistic data
      const now = Math.floor(Date.now() / 1000);
      const data = [];
      const volatility = entryPrice * 0.001;

      for (let i = 50; i >= 0; i--) {
        const time = now - i * 300;
        const open = entryPrice + (Math.random() - 0.5) * volatility * 2;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        data.push({
          time,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
        });
      }

      candlestickSeries.setData(data);

      // Add lines
      candlestickSeries.createPriceLine({
        price: entryPrice,
        color: '#787b86',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Entry',
      });

      candlestickSeries.createPriceLine({
        price: parseFloat(signal.stopLoss),
        color: '#ef5350',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'SL',
      });

      const tpPrice = signal.targets ? signal.targets[0] : signal.takeProfit;
      candlestickSeries.createPriceLine({
        price: parseFloat(tpPrice),
        color: '#26a69a',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'TP',
      });

      chart.timeScale().fitContent();

    } catch (error) {
      console.error('Chart error:', error);
    }

    // Cleanup
    return () => {
      if (chart) {
        chart.remove();
      }
    };
  }, [signal]);

  return <div ref={chartContainerRef} className="w-full" />;
}

