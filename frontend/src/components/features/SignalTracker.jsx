import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, TrendingUp, TrendingDown, Clock, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTradeSocket } from '../../hooks/useTradeSocket';
import { getPositions } from '../../services/api';
import { formatPrice } from '../../utils/pipCalculator';

// Helper function to move signal to history
const moveToHistory = (signal) => {
  try {
    const saved = localStorage.getItem('behtarin_closed_signals');
    const history = saved ? JSON.parse(saved) : [];
    
    signal.closeTime = signal.closeTime || Date.now();
    
    // Check if already exists
    const exists = history.some(h => h.id === signal.id && h.closeTime === signal.closeTime);
    if (!exists) {
      history.unshift(signal);
      if (history.length > 100) history.splice(100);
      localStorage.setItem('behtarin_closed_signals', JSON.stringify(history));
      console.log('📁 Moved to history:', signal.id);
    }
  } catch (e) {
    console.error('Error moving to history:', e);
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

export default function SignalTracker() {
  const navigate = useNavigate();
  const { notifications } = useTradeSocket();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  
  // Load signals from localStorage
  const [signals, setSignals] = useState(() => {
    try {
      const saved = localStorage.getItem('behtarin_signals');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  // Load history from localStorage
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('behtarin_closed_signals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [positions, setPositions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);
  const processedNotifs = useRef(new Set());
  const pendingDeals = useRef([]);
  const prevPositionsRef = useRef(new Map());
  
  // Save signals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('behtarin_signals', JSON.stringify(signals));
    } catch (e) {
      console.error('Error saving signals:', e);
    }
  }, [signals]);

  // Reload history when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      try {
        const saved = localStorage.getItem('behtarin_closed_signals');
        setHistory(saved ? JSON.parse(saved) : []);
      } catch {
        setHistory([]);
      }
    }
  }, [activeTab]);

  // Sync positions to signals
  const syncPositionsToSignals = async () => {
    setRefreshing(true);
    const pos = await getPositions();
    const openPositionCodes = new Set();
    
    if (pos && pos.length > 0) {
      pos.forEach(p => {
        const code = p.magic || p.comment || p.id?.toString().slice(-8);
        openPositionCodes.add(code);
      });
    }
    
    setSignals(prev => {
      const updated = { ...prev };
      let changed = false;
      
      // Add new positions
      if (pos && pos.length > 0) {
        pos.forEach(p => {
          const code = p.magic || p.comment || p.id?.toString().slice(-8);
          if (!updated[code]) {
            const isBuy = p.type?.includes('BUY');
            updated[code] = {
              id: code,
              symbol: p.symbol,
              type: isBuy ? 'buy' : 'sell',
              isBuy,
              openPrice: p.openPrice,
              volume: p.volume,
              openTime: p.time || Date.now(),
              status: 'active',
              actions: [],
              liveProfit: p.profit || 0,
              livePrice: p.currentPrice,
              liveVolume: p.volume
            };
            changed = true;
          }
        });
      }
      
      // Move closed signals to history
      Object.keys(updated).forEach(code => {
        if (!openPositionCodes.has(code)) {
          const signal = updated[code];
          signal.status = 'closed';
          signal.closeTime = signal.closeTime || Date.now();
          signal.totalProfit = signal.closeProfit || signal.liveProfit || 0;
          moveToHistory(signal);
          delete updated[code];
          changed = true;
        }
      });
      
      return changed ? updated : prev;
    });
    
    setRefreshing(false);
  };

  // Sync on mount and visibility change
  useEffect(() => {
    syncPositionsToSignals();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncPositionsToSignals();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Fetch positions periodically
  useEffect(() => {
    const fetchPositions = async () => {
      const pos = await getPositions();
      if (pos) {
        const currentPositions = new Map();
        
        pos.forEach(p => {
          const code = p.magic || p.comment || p.id?.toString().slice(-8);
          currentPositions.set(code, {
            fullId: p.id?.toString() || '',
            volume: p.volume,
            profit: p.profit,
            price: p.currentPrice
          });
        });
        
        // Detect partial closes
        pos.forEach(p => {
          const code = p.magic || p.comment || p.id?.toString().slice(-8);
          const fullId = p.id?.toString() || '';
          const prevData = prevPositionsRef.current.get(code);
          
          if (prevData && prevData.volume > p.volume + 0.001) {
            const closedVol = prevData.volume - p.volume;
            const dealIndex = pendingDeals.current.findIndex(d => {
              const idMatch = d.positionId === fullId || d.positionId.endsWith(code);
              const volMatch = Math.abs(d.volume - closedVol) < 0.005;
              const timeOk = Date.now() - d.timestamp < 15000;
              return idMatch && volMatch && timeOk;
            });
            
            let profit = dealIndex !== -1 ? pendingDeals.current[dealIndex].profit : (prevData.profit || 0) * (closedVol / prevData.volume);
            let price = dealIndex !== -1 ? pendingDeals.current[dealIndex].price : p.currentPrice;
            
            if (dealIndex !== -1) pendingDeals.current.splice(dealIndex, 1);
            
            setSignals(prev => {
              if (!prev[code]) return prev;
              return {
                ...prev,
                [code]: {
                  ...prev[code],
                  actions: [
                    ...(prev[code].actions || []),
                    {
                      type: 'partial_close',
                      closedVolume: closedVol.toFixed(2),
                      remainingVolume: p.volume.toFixed(2),
                      profit,
                      price,
                      timestamp: new Date().toISOString()
                    }
                  ]
                }
              };
            });
          }
          
          // Update live data
          setSignals(prev => {
            if (!prev[code]) return prev;
            return {
              ...prev,
              [code]: {
                ...prev[code],
                livePrice: p.currentPrice,
                liveProfit: p.profit,
                liveVolume: p.volume
              }
            };
          });
        });
        
        // Check for full closes
        if (prevPositionsRef.current.size > 0) {
          prevPositionsRef.current.forEach((prevData, code) => {
            if (!currentPositions.has(code)) {
              const dealIndex = pendingDeals.current.findIndex(d => {
                return d.positionId.endsWith(code) && Date.now() - d.timestamp < 15000;
              });
              
              let profit = dealIndex !== -1 ? pendingDeals.current[dealIndex].profit : prevData.profit || 0;
              let price = dealIndex !== -1 ? pendingDeals.current[dealIndex].price : prevData.price;
              
              if (dealIndex !== -1) pendingDeals.current.splice(dealIndex, 1);
              
              setSignals(prev => {
                if (!prev[code] || prev[code].status === 'closed') return prev;
                
                const existingActions = prev[code].actions || [];
                const partialProfits = existingActions.reduce((sum, a) => sum + (a.profit || 0), 0);
                const totalProfit = partialProfits + profit;
                
                const closedSignal = {
                  ...prev[code],
                  status: 'closed',
                  closePrice: price,
                  closeProfit: totalProfit,
                  totalProfit: totalProfit,
                  closeTime: new Date().toISOString(),
                  actions: [
                    ...existingActions,
                    { type: 'closed', price, profit, volume: prevData.volume?.toFixed(2), timestamp: new Date().toISOString() }
                  ]
                };
                
                moveToHistory(closedSignal);
                const { [code]: removed, ...remaining } = prev;
                return remaining;
              });
            }
          });
        }
        
        prevPositionsRef.current = currentPositions;
        setPositions(pos);
      }
    };
    
    fetchPositions();
    const interval = setInterval(fetchPositions, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle WebSocket notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const notif = notifications[0];
      const notifId = `${notif.event}-${notif.data?.id}-${notif.timestamp}`;
      
      if (processedNotifs.current.has(notifId)) return;
      processedNotifs.current.add(notifId);
      
      const signalCode = notif.data?.magic || notif.data?.comment || notif.data?.id?.toString().slice(-8) || 'Unknown';
      
      if (notif.event === 'position_opened') {
        const isBuy = notif.data?.type?.includes('BUY');
        setSignals(prev => ({
          ...prev,
          [signalCode]: {
            id: signalCode,
            symbol: notif.data?.symbol,
            type: isBuy ? 'buy' : 'sell',
            isBuy,
            openPrice: notif.data?.openPrice,
            volume: notif.data?.volume,
            openTime: notif.timestamp,
            status: 'active',
            actions: [],
            liveProfit: 0,
            livePrice: notif.data?.openPrice,
            liveVolume: notif.data?.volume
          }
        }));
      } else if (notif.event === 'deal_closed') {
        pendingDeals.current.push({
          positionId: notif.data?.positionId?.toString() || '',
          profit: notif.data?.profit || 0,
          volume: notif.data?.volume || 0,
          price: notif.data?.price,
          timestamp: Date.now()
        });
        if (pendingDeals.current.length > 20) pendingDeals.current.splice(0, pendingDeals.current.length - 20);
      }
    }
  }, [notifications]);

  // Calculate totals
  const activeSignals = Object.values(signals);
  const totalActiveProfit = activeSignals.reduce((sum, s) => sum + (s.liveProfit || 0), 0);
  const totalHistoryProfit = history.reduce((sum, s) => sum + (s.totalProfit || 0), 0);

  // Clear history
  const clearHistory = () => {
    if (confirm('تمام تاریخچه پاک شود؟')) {
      localStorage.removeItem('behtarin_closed_signals');
      setHistory([]);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0e1621]">
      {/* Header */}
      <div className="bg-[#17212b] text-white p-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95">
            <ArrowLeft size={22} className="text-gray-400" />
          </button>
          <div>
            <div className="font-bold text-[15px]">📊 Signal Tracker</div>
            <div className="text-[11px] text-gray-400">
              {activeSignals.length} فعال • {history.length} بسته شده
            </div>
          </div>
        </div>
        <button 
          onClick={syncPositionsToSignals}
          disabled={refreshing}
          className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95"
        >
          <RefreshCw size={20} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#17212b] border-b border-[#0e1621] flex-shrink-0">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'active' ? 'text-green-400' : 'text-gray-500'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Clock size={16} />
            <span>فعال ({activeSignals.length})</span>
          </div>
          {activeTab === 'active' && (
            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'history' ? 'text-blue-400' : 'text-gray-500'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            <span>تاریخچه ({history.length})</span>
          </div>
          {activeTab === 'history' && (
            <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
      </div>

      {/* Total Profit Bar */}
      {activeTab === 'active' && activeSignals.length > 0 && (
        <div className={`px-4 py-2 ${totalActiveProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">سود/زیان لحظه‌ای:</span>
            <span className={`font-bold ${totalActiveProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalActiveProfit >= 0 ? '+' : ''}{totalActiveProfit.toFixed(2)}$
            </span>
          </div>
        </div>
      )}

      {activeTab === 'history' && history.length > 0 && (
        <div className={`px-4 py-2 ${totalHistoryProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-between flex-shrink-0`}>
          <span className="text-gray-400 text-xs">مجموع سود/زیان:</span>
          <div className="flex items-center gap-3">
            <span className={`font-bold ${totalHistoryProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalHistoryProfit >= 0 ? '+' : ''}{totalHistoryProfit.toFixed(2)}$
            </span>
            <button onClick={clearHistory} className="p-1 hover:bg-red-500/20 rounded transition">
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          {activeTab === 'active' ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {activeSignals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Bell size={48} className="mb-3 opacity-50" />
                  <p className="text-sm">معامله فعالی وجود ندارد</p>
                  <p className="text-xs text-gray-600 mt-1">منتظر سیگنال‌های جدید...</p>
                </div>
              ) : (
                activeSignals.map((signal) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#182533] rounded-xl overflow-hidden border border-white/5"
                  >
                    {/* Signal Header */}
                    <div className={`p-3 ${signal.isBuy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {signal.isBuy ? (
                            <TrendingUp size={18} className="text-green-400" />
                          ) : (
                            <TrendingDown size={18} className="text-red-400" />
                          )}
                          <span className="text-white font-bold">{getSymbolName(signal.symbol)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${signal.isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {signal.isBuy ? 'BUY' : 'SELL'}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs font-mono">#{signal.id}</span>
                      </div>
                    </div>
                    
                    {/* Signal Body */}
                    <div className="p-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500 block">Entry</span>
                          <span className="text-white">{formatPrice(signal.openPrice, signal.symbol)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Current</span>
                          <span className="text-white">{formatPrice(signal.livePrice, signal.symbol)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Volume</span>
                          <span className="text-white">{signal.liveVolume?.toFixed(2) || signal.volume} lot</span>
                        </div>
                      </div>
                      
                      {/* Live P/L */}
                      <div className={`text-center py-2 rounded-lg ${(signal.liveProfit || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        <span className={`font-bold text-lg ${(signal.liveProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(signal.liveProfit || 0) >= 0 ? '+' : ''}{(signal.liveProfit || 0).toFixed(2)}$
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <CheckCircle size={48} className="mb-3 opacity-50" />
                  <p className="text-sm">تاریخچه خالی است</p>
                  <p className="text-xs text-gray-600 mt-1">معاملات بسته شده اینجا نمایش داده می‌شوند</p>
                </div>
              ) : (
                history.map((signal, idx) => (
                  <motion.div
                    key={signal.id + '-' + idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-[#182533] rounded-xl overflow-hidden border border-white/5"
                  >
                    {/* Signal Header */}
                    <div className="p-3 bg-[#1c2733]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {signal.isBuy ? (
                            <TrendingUp size={16} className="text-green-400" />
                          ) : (
                            <TrendingDown size={16} className="text-red-400" />
                          )}
                          <span className="text-white font-medium text-sm">{getSymbolName(signal.symbol)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${signal.isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {signal.isBuy ? 'BUY' : 'SELL'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 text-[10px] font-mono block">#{signal.id}</span>
                          <span className="text-gray-600 text-[10px]">
                            {new Date(signal.closeTime).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Signal Body */}
                    <div className="p-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-xs">
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
                      
                      {/* P/L */}
                      <div className={`text-center py-2 rounded-lg ${(signal.totalProfit || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        <span className={`font-bold ${(signal.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(signal.totalProfit || 0) >= 0 ? '+' : ''}{(signal.totalProfit || 0).toFixed(2)}$
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
