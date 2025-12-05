import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, History, TrendingUp, TrendingDown, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/pipCalculator';

export default function TradeHistory() {
  const navigate = useNavigate();
  
  // Load closed signals from localStorage
  const [closedSignals, setClosedSignals] = useState(() => {
    try {
      const saved = localStorage.getItem('behtarin_closed_signals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate total profit
  const totalProfit = closedSignals.reduce((sum, signal) => {
    return sum + (signal.totalProfit || 0);
  }, 0);

  // Group by date
  const groupedByDate = closedSignals.reduce((groups, signal) => {
    const date = new Date(signal.closeTime || signal.openTime).toLocaleDateString('fa-IR');
    if (!groups[date]) groups[date] = [];
    groups[date].push(signal);
    return groups;
  }, {});

  // Clear history
  const clearHistory = () => {
    if (confirm('آیا مطمئن هستید؟ تمام تاریخچه پاک می‌شود.')) {
      localStorage.removeItem('behtarin_closed_signals');
      setClosedSignals([]);
    }
  };

  // Get symbol display name
  const getSymbolName = (symbol) => {
    if (symbol?.includes('XAU')) return 'Gold';
    if (symbol?.includes('XAG')) return 'Silver';
    if (symbol?.includes('EUR')) return 'EUR/USD';
    if (symbol?.includes('GBP')) return 'GBP/USD';
    return symbol?.replace('.ec', '') || 'Unknown';
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0e1621]">
      {/* Safe Area Top Spacer */}
      <div className="bg-[#17212b]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
      
      {/* Header */}
      <div className="bg-[#17212b] text-white px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-xl transition active:scale-95">
            <ArrowLeft size={24} className="text-gray-300" />
          </button>
          <div>
            <div className="font-bold text-base flex items-center gap-2">
              <History size={20} className="text-blue-400" />
              تاریخچه معاملات
            </div>
            <div className="text-xs text-gray-400">
              {closedSignals.length} معامله بسته شده
            </div>
          </div>
        </div>
        {closedSignals.length > 0 && (
          <button 
            onClick={clearHistory}
            className="p-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition active:scale-95"
          >
            <Trash2 size={20} className="text-red-400" />
          </button>
        )}
      </div>

      {/* Total Profit/Loss Bar */}
      {closedSignals.length > 0 && (
        <div className={`px-4 py-3 ${totalProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} border-b border-[#0e1621]`}>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">مجموع سود/زیان:</span>
            <span className={`font-bold text-lg ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}$
            </span>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {closedSignals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <History size={48} className="mb-3 opacity-50" />
            <p>هنوز معامله‌ای بسته نشده</p>
          </div>
        ) : (
          Object.entries(groupedByDate)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, signals]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-500">{date}</span>
                </div>
                
                {/* Signals for this date */}
                <div className="space-y-2">
                  {signals.map((signal, idx) => (
                    <motion.div
                      key={signal.id + '-' + idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#182533] rounded-xl p-3 border border-white/5"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${signal.isBuy ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {signal.isBuy ? (
                              <TrendingUp size={14} className="text-green-400" />
                            ) : (
                              <TrendingDown size={14} className="text-red-400" />
                            )}
                          </div>
                          <div>
                            <span className="text-white font-medium text-sm">
                              {getSymbolName(signal.symbol)}
                            </span>
                            <span className={`ml-2 text-xs ${signal.isBuy ? 'text-green-400' : 'text-red-400'}`}>
                              {signal.isBuy ? 'BUY' : 'SELL'}
                            </span>
                          </div>
                        </div>
                        <span className="text-gray-500 text-xs font-mono">#{signal.id}</span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-gray-500 block">Entry</span>
                          <span className="text-white">{formatPrice(signal.openPrice, signal.symbol)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Close</span>
                          <span className="text-white">{formatPrice(signal.closePrice, signal.symbol)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Volume</span>
                          <span className="text-white">{signal.volume} lot</span>
                        </div>
                      </div>

                      {/* Profit/Loss */}
                      <div className={`text-center py-2 rounded-lg ${
                        (signal.totalProfit || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}>
                        <span className={`font-bold ${
                          (signal.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(signal.totalProfit || 0) >= 0 ? '+' : ''}{(signal.totalProfit || 0).toFixed(2)}$
                        </span>
                      </div>

                      {/* Actions History */}
                      {signal.actions && signal.actions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="text-[10px] text-gray-500 mb-1">عملیات‌ها:</div>
                          <div className="space-y-1">
                            {signal.actions.map((action, i) => (
                              <div key={i} className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-400">
                                  {action.type === 'partial' ? 'Partial Close' : 'Full Close'} ({action.volume} lot)
                                </span>
                                <span className={action.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {action.profit >= 0 ? '+' : ''}{action.profit?.toFixed(2)}$
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

