import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, ChevronUp, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPositions, getAccountInfo } from '../../services/api';

export default function MT5ChartView() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [positions, setPositions] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const [showPositions, setShowPositions] = useState(true);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pos, acc] = await Promise.all([
        getPositions(),
        getAccountInfo()
      ]);
      setPositions(pos || []);
      setAccount(acc);
      
      // Auto select first position's symbol
      if (pos && pos.length > 0 && !selectedSymbol) {
        setSelectedSymbol(pos[0].symbol);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load TradingView widget
  useEffect(() => {
    if (!containerRef.current || !selectedSymbol) return;

    // Clear previous
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `OANDA:${selectedSymbol.replace(/[^A-Z]/g, '')}`,
      interval: '5',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(0, 0, 0, 1)',
      gridColor: 'rgba(30, 30, 30, 1)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: true,
      support_host: 'https://www.tradingview.com'
    });

    containerRef.current.appendChild(script);
  }, [selectedSymbol]);

  const totalProfit = positions.reduce((sum, p) => sum + (p.profit || 0), 0);

  return (
    <div className="bg-black text-white h-screen flex flex-col">
      {/* Top Bar - Account Info */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="p-1 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Balance</div>
            <div className="font-mono text-sm">${account?.balance?.toFixed(2) || '---'}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Equity</div>
            <div className="font-mono text-sm">${account?.equity?.toFixed(2) || '---'}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase">P/L</div>
            <div className={`font-mono text-sm ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}$
            </div>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-[#2a2a2a] rounded">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Symbol Tabs */}
      <div className="bg-[#111] border-b border-[#2a2a2a] px-2 py-1 flex gap-1 overflow-x-auto">
        {[...new Set(['XAUUSD', ...positions.map(p => p.symbol)])].map(symbol => {
          const symbolPos = positions.filter(p => p.symbol === symbol);
          const hasPosition = symbolPos.length > 0;
          
          return (
            <button
              key={symbol}
              onClick={() => setSelectedSymbol(symbol)}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                selectedSymbol === symbol 
                  ? 'bg-[#2962ff] text-white' 
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
              }`}
            >
              {symbol}
              {hasPosition && (
                <span className={`w-2 h-2 rounded-full ${symbolPos.some(p => p.profit >= 0) ? 'bg-green-500' : 'bg-red-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Chart Area - Clean, no overlays */}
      <div className="flex-1 relative">
        <div 
          ref={containerRef}
          className="tradingview-widget-container w-full h-full"
        />
      </div>

      {/* Bottom Panel - Positions List */}
      <div className={`bg-[#111] border-t border-[#2a2a2a] transition-all ${showPositions ? 'h-[150px]' : 'h-[40px]'}`}>
        {/* Toggle Header */}
        <button 
          onClick={() => setShowPositions(!showPositions)}
          className="w-full px-3 py-2 flex justify-between items-center hover:bg-[#1a1a1a] transition"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Positions</span>
            <span className="bg-[#2962ff] text-white px-1.5 py-0.5 rounded text-[10px]">
              {positions.length}
            </span>
          </div>
          {showPositions ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Positions Table */}
        <AnimatePresence>
          {showPositions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-auto h-[110px]"
            >
              {positions.length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-6">
                  No open positions
                </div>
              ) : (
                <table className="w-full text-[11px]">
                  <thead className="bg-[#1a1a1a] sticky top-0">
                    <tr className="text-gray-500">
                      <th className="text-left px-3 py-1.5">Symbol</th>
                      <th className="text-left px-3 py-1.5">Type</th>
                      <th className="text-right px-3 py-1.5">Vol</th>
                      <th className="text-right px-3 py-1.5">Open</th>
                      <th className="text-right px-3 py-1.5">Current</th>
                      <th className="text-right px-3 py-1.5">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(pos => {
                      const isBuy = pos.type?.includes('BUY');
                      const isProfit = pos.profit >= 0;
                      
                      return (
                        <tr 
                          key={pos.id}
                          onClick={() => setSelectedSymbol(pos.symbol)}
                          className={`border-b border-[#222] hover:bg-[#1a1a1a] cursor-pointer transition ${
                            selectedSymbol === pos.symbol ? 'bg-[#1a1a2a]' : ''
                          }`}
                        >
                          <td className="px-3 py-2 font-medium">{pos.symbol}</td>
                          <td className={`px-3 py-2 font-bold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                            {isBuy ? 'BUY' : 'SELL'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{pos.volume}</td>
                          <td className="px-3 py-2 text-right font-mono">{pos.openPrice?.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-mono text-yellow-500">{pos.currentPrice?.toFixed(2)}</td>
                          <td className={`px-3 py-2 text-right font-mono font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                            {isProfit ? '+' : ''}{pos.profit?.toFixed(2)}$
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
