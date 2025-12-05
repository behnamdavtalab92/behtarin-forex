import { useEffect, useRef } from 'react';

export default function TradingViewChart({ signal }) {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    // Parse entry (first number only)
    let firstEntry = 4215;
    if (typeof signal.entry === 'string') {
      const parts = signal.entry.split('-');
      firstEntry = parseFloat(parts[0].trim());
    }
    
    // Get last TP
    const lastTP = signal.targets ? signal.targets[signal.targets.length - 1] : signal.takeProfit;
    const stopLoss = parseFloat(signal.stopLoss);

    // Parse symbol (remove special chars)
    const symbol = signal.symbol.replace(/[^A-Z]/g, '');
    
    // Create TradingView Widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `OANDA:${symbol}`,
      interval: '5',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(0, 0, 0, 1)',
      gridColor: 'rgba(26, 26, 26, 1)',
      hide_top_toolbar: false,
      hide_legend: true,
      save_image: false,
      container_id: `tradingview_${signal.id}`,
      studies: [
        {
          id: 'HorizontalLine@tv-basicstudies',
          inputs: {
            price: stopLoss,
            color: '#ef5350',
            linewidth: 2,
            linestyle: 0,
            showLabel: true,
            textcolor: '#ffffff',
            horzLabelsAlign: 'right',
            vertLabelsAlign: 'middle'
          }
        },
        {
          id: 'HorizontalLine@tv-basicstudies',
          inputs: {
            price: firstEntry,
            color: '#787b86',
            linewidth: 2,
            linestyle: 2,
            showLabel: true,
            textcolor: '#ffffff',
            horzLabelsAlign: 'right',
            vertLabelsAlign: 'middle'
          }
        },
        {
          id: 'HorizontalLine@tv-basicstudies',
          inputs: {
            price: lastTP,
            color: '#26a69a',
            linewidth: 2,
            linestyle: 0,
            showLabel: true,
            textcolor: '#ffffff',
            horzLabelsAlign: 'right',
            vertLabelsAlign: 'middle'
          }
        }
      ]
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [signal]);

  // Parse entry (first number only)
  let firstEntry = 4215;
  if (typeof signal.entry === 'string') {
    const parts = signal.entry.split('-');
    firstEntry = parseFloat(parts[0].trim());
  }
  
  // Get last TP
  const lastTP = signal.targets ? signal.targets[signal.targets.length - 1] : signal.takeProfit;
  const stopLoss = parseFloat(signal.stopLoss);

  return (
    <div className="relative w-full h-[350px] bg-black">
      {/* TradingView Chart Container */}
      <div 
        id={`tradingview_${signal.id}`}
        ref={containerRef}
        className="tradingview-widget-container w-full h-full"
      />
      
      {/* Simple Overlay (as fallback visual) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Stop Loss Zone (Red) */}
        <div 
          className="absolute left-0 right-16 bg-red-500/15 border-t border-red-500/50" 
          style={{ 
            top: '15%',
            height: '20%'
          }}
        >
          <div className="absolute right-0 top-1 bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold rounded">
            SL: {stopLoss}
          </div>
        </div>
        
        {/* Entry Line */}
        <div 
          className="absolute left-0 right-16 border-t-2 border-dashed border-white" 
          style={{ top: '35%' }}
        >
          <div className="absolute right-0 -mt-3 bg-gray-700 text-white text-[10px] px-2 py-0.5 font-bold rounded">
            Entry: {firstEntry}
          </div>
        </div>
        
        {/* Take Profit Zone (Green) */}
        <div 
          className="absolute left-0 right-16 bg-green-500/15 border-b border-green-500/50" 
          style={{ 
            top: '35%',
            height: '40%'
          }}
        >
          <div className="absolute right-0 bottom-1 bg-green-500 text-white text-[10px] px-2 py-0.5 font-bold rounded">
            TP: {lastTP}
          </div>
        </div>
      </div>
    </div>
  );
}
