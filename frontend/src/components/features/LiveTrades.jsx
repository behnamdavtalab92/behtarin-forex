import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { getTradesData } from '../../services/api';

export default function LiveTrades() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const result = await getTradesData();
    if (result) {
      setData(result);
      setConnected(result.connected);
      setLastUpdate(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatProfit = (profit) => {
    const isPositive = profit >= 0;
    return (
      <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {isPositive ? '+' : ''}{profit?.toFixed(2)} $
      </span>
    );
  };

  return (
    <div className="bg-black text-white min-h-screen pb-20">
      {/* Account Info */}
      {data?.account && !data.account.error && (
        <div className="p-4 bg-gradient-to-r from-[#101010] to-[#1a1a1a] border-b border-[#1f1f1f]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-yellow-500" />
              <span className="font-semibold">{data.account.name || 'Account'}</span>
            </div>
            <button 
              onClick={fetchData}
              className="p-2 bg-[#1f1f1f] rounded-lg hover:bg-[#2f2f2f] transition"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/50 rounded-lg p-3">
              <p className="text-gray-500 text-[10px] uppercase">Balance</p>
              <p className="font-mono text-lg">${data.account.balance?.toFixed(2)}</p>
            </div>
            <div className="bg-black/50 rounded-lg p-3">
              <p className="text-gray-500 text-[10px] uppercase">Equity</p>
              <p className="font-mono text-lg">${data.account.equity?.toFixed(2)}</p>
            </div>
            <div className="bg-black/50 rounded-lg p-3">
              <p className="text-gray-500 text-[10px] uppercase">Profit</p>
              <p className="font-mono text-lg">{formatProfit(data.account.profit)}</p>
            </div>
            <div className="bg-black/50 rounded-lg p-3">
              <p className="text-gray-500 text-[10px] uppercase">Free Margin</p>
              <p className="font-mono text-lg">${data.account.freeMargin?.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Not Connected */}
      {!connected && !loading && (
        <div className="p-8 text-center">
          <WifiOff size={48} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">MetaTrader Not Connected</h2>
          <p className="text-gray-500 text-sm">Run backend server to connect</p>
        </div>
      )}

      {/* Open Positions */}
      {connected && data?.positions?.length > 0 && (
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Open Positions ({data.positions.length})
          </h2>
          
          <AnimatePresence>
            {data.positions.map((pos, index) => {
              const isBuy = pos.type?.includes('BUY');
              const isProfit = pos.profit >= 0;
              
              return (
                <motion.div
                  key={pos.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#111] rounded-xl mb-3 overflow-hidden border border-[#222]"
                >
                  {/* Header */}
                  <div className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {isBuy ? (
                        <TrendingUp size={20} className="text-green-500" />
                      ) : (
                        <TrendingDown size={20} className="text-red-500" />
                      )}
                      <div>
                        <div className="font-bold text-lg">{pos.symbol}</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                            {isBuy ? 'BUY' : 'SELL'}
                          </span>
                          <span className="text-xs text-gray-500">{pos.volume} lot</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        {isProfit ? '+' : ''}{pos.profit?.toFixed(2)}$
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-px bg-[#222]">
                    <div className="bg-[#0a0a0a] p-3">
                      <div className="text-gray-500 text-[10px] uppercase">Open</div>
                      <div className="font-mono text-sm">{pos.openPrice?.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#0a0a0a] p-3">
                      <div className="text-yellow-500 text-[10px] uppercase">Current</div>
                      <div className="font-mono text-sm text-yellow-400">{pos.currentPrice?.toFixed(2)}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* No Positions */}
      {connected && data?.positions?.length === 0 && (
        <div className="p-8 text-center">
          <TrendingUp size={48} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Open Positions</h2>
          <p className="text-gray-500 text-sm">Your trades will appear here</p>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="p-8 text-center">
          <RefreshCw size={32} className="mx-auto animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      )}
    </div>
  );
}
