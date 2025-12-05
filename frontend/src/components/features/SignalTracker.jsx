import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTradeSocket } from '../../hooks/useTradeSocket';
import { getPositions } from '../../services/api';
import { formatPrice } from '../../utils/pipCalculator';

export default function SignalTracker() {
  const navigate = useNavigate();
  const { notifications } = useTradeSocket();
  
  // Load signals from localStorage on mount
  const [signals, setSignals] = useState(() => {
    try {
      const saved = localStorage.getItem('behtarin_signals');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [positions, setPositions] = useState([]);
  const messagesEndRef = useRef(null);
  const processedNotifs = useRef(new Set());
  const pendingDeals = useRef([]);

  // Track previous positions with their volumes
  const prevPositionsRef = useRef(new Map()); // code -> { volume, profit, price }
  
  // Save signals to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('behtarin_signals', JSON.stringify(signals));
    } catch (e) {
      console.error('Error saving signals:', e);
    }
  }, [signals]);

  // Fetch positions
  useEffect(() => {
    const fetchPositions = async () => {
      const pos = await getPositions();
      if (pos) {
        const currentPositions = new Map();
        
        // First pass: collect current positions
        pos.forEach(p => {
          const code = p.magic || p.comment || p.id?.toString().slice(-8);
          currentPositions.set(code, {
            fullId: p.id?.toString() || '',
            volume: p.volume,
            profit: p.profit,
            price: p.currentPrice
          });
        });
        
        // Second pass: detect volume changes and update live data
        pos.forEach(p => {
          const code = p.magic || p.comment || p.id?.toString().slice(-8);
          const fullId = p.id?.toString() || '';
          const prevData = prevPositionsRef.current.get(code);
          
          // Detect volume decrease (partial close)
          if (prevData && prevData.volume > p.volume + 0.001) {
            const closedVol = prevData.volume - p.volume;
            const closedVolume = closedVol.toFixed(2);
            const remainingVolume = p.volume;
            
            // Find matching deal from WebSocket by positionId and volume
            const dealIndex = pendingDeals.current.findIndex(d => {
              const idMatch = d.positionId === fullId || 
                              d.positionId.endsWith(code) || 
                              fullId.endsWith(d.positionId.slice(-8));
              const volMatch = Math.abs(d.volume - closedVol) < 0.005;
              const timeOk = Date.now() - d.timestamp < 15000; // 15 seconds
              return idMatch && volMatch && timeOk;
            });
            
            let profit;
            let price;
            
            if (dealIndex !== -1) {
              // Use accurate profit from WebSocket
              profit = pendingDeals.current[dealIndex].profit;
              price = pendingDeals.current[dealIndex].price;
              console.log('✅ Using WebSocket profit:', profit.toFixed(2));
              pendingDeals.current.splice(dealIndex, 1);
            } else {
              // Fallback: calculate proportional profit
              const profitPerLot = prevData.volume > 0 ? (prevData.profit || 0) / prevData.volume : 0;
              profit = profitPerLot * closedVol;
              price = p.currentPrice;
              console.log('⚠️ Using calculated profit:', profit.toFixed(2), '(no matching deal found)');
            }
            
            console.log('Volume:', prevData.volume.toFixed(2), '→', p.volume.toFixed(2), '| Profit:', profit.toFixed(2));
            
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
                      closedVolume,
                      remainingVolume: remainingVolume.toFixed(2),
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
        
        // Check for positions that completely disappeared (full close)
        if (prevPositionsRef.current.size > 0) {
          prevPositionsRef.current.forEach((prevData, code) => {
            if (!currentPositions.has(code)) {
              console.log('Position fully closed:', code);
              
              // Find matching deal from WebSocket for accurate profit
              const dealIndex = pendingDeals.current.findIndex(d => {
                const idMatch = d.positionId.endsWith(code) || code.endsWith(d.positionId.slice(-8));
                const timeOk = Date.now() - d.timestamp < 15000;
                return idMatch && timeOk;
              });
              
              let profit = prevData.profit || 0;
              let price = prevData.price;
              
              if (dealIndex !== -1) {
                profit = pendingDeals.current[dealIndex].profit;
                price = pendingDeals.current[dealIndex].price;
                console.log('✅ Using WebSocket profit for close:', profit.toFixed(2));
                pendingDeals.current.splice(dealIndex, 1);
              } else {
                console.log('⚠️ Using last known profit for close:', profit.toFixed(2));
              }
              
              setSignals(prev => {
                if (!prev[code] || prev[code].status === 'closed') return prev;
                
                // Calculate total P/L = sum of all partial profits + this close profit
                const existingActions = prev[code].actions || [];
                const partialProfits = existingActions.reduce((sum, a) => sum + (a.profit || 0), 0);
                const totalProfit = partialProfits + profit;
                
                console.log('Total P/L calculation:', partialProfits.toFixed(2), '+', profit.toFixed(2), '=', totalProfit.toFixed(2));
                
                return {
                  ...prev,
                  [code]: {
                    ...prev[code],
                    status: 'closed',
                    closePrice: price,
                    closeProfit: totalProfit, // Total of all actions
                    closeTime: new Date().toISOString(),
                    actions: [
                      ...existingActions,
                      {
                        type: 'closed',
                        price,
                        profit, // This action's profit
                        volume: prevData.volume?.toFixed(2),
                        timestamp: new Date().toISOString()
                      }
                    ]
                  }
                };
              });
            }
          });
        }
        
        // Update refs for next comparison
        prevPositionsRef.current = currentPositions;
        setPositions(pos);
      }
    };
    fetchPositions();
    const interval = setInterval(fetchPositions, 2000); // Update P/L every 2 seconds
    return () => clearInterval(interval);
  }, []);

  // Convert notifications to signals
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
        // Save accurate profit from deal
        const positionId = notif.data?.positionId?.toString() || '';
        const dealProfit = notif.data?.profit || 0;
        const dealVolume = notif.data?.volume || 0;
        const dealPrice = notif.data?.price;
        
        console.log('Deal closed:', { positionId, profit: dealProfit, volume: dealVolume });
        
        // Store by positionId (full ID)
        pendingDeals.current.push({
          positionId,
          profit: dealProfit,
          volume: dealVolume,
          price: dealPrice,
          timestamp: Date.now()
        });
        
        // Keep only last 20 deals, remove old ones
        if (pendingDeals.current.length > 20) {
          pendingDeals.current = pendingDeals.current.slice(-20);
        }
        
      } else if (notif.event === 'position_closed') {
        console.log('Ignoring position_closed');
      }
    }
  }, [notifications]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [signals]);

  // Get active signals
  const activeSignals = positions.map(pos => ({
    code: pos.magic || pos.comment || pos.id?.toString().slice(-8),
    symbol: pos.symbol,
    type: pos.type?.includes('BUY') ? 'BUY' : 'SELL',
    volume: pos.volume,
    profit: pos.profit
  }));

  // Convert signals object to array sorted by time
  const signalsList = Object.values(signals).sort((a, b) => 
    new Date(a.openTime) - new Date(b.openTime)
  );

  return (
    <div className="h-screen flex flex-col bg-[#0e1621] safe-top">
      {/* Header */}
      <div className="bg-[#17212b] text-white p-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="p-1 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft size={22} className="text-gray-400" />
          </button>
          <div>
            <div className="font-bold text-[15px]">📊 Signal Tracker</div>
            <div className="text-[11px] text-gray-400">
              {activeSignals.length} سیگنال فعال
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <MoreVertical size={20} className="text-gray-400" />
        </div>
      </div>

      {/* Active Signals Bar */}
      {activeSignals.length > 0 && (
        <div className="bg-[#1c2733] px-3 py-2 flex gap-2 overflow-x-auto border-b border-[#0e1621]">
          {activeSignals.map((signal, idx) => (
            <div 
              key={idx}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                signal.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              <span className="font-mono font-bold">{signal.code}</span>
              <span>{signal.symbol}</span>
              <span className="text-gray-400">{signal.volume}lot</span>
              <span className={signal.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                {signal.profit >= 0 ? '+' : ''}{signal.profit?.toFixed(1)}$
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Signals */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex justify-center">
          <div className="bg-[#182533] text-gray-400 text-[11px] px-3 py-1 rounded-full">
            امروز
          </div>
        </div>

        {signalsList.length === 0 && (
          <div className="flex justify-center mt-10">
            <div className="bg-[#182533] text-gray-400 text-sm px-4 py-3 rounded-xl text-center">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <div>منتظر سیگنال‌های جدید...</div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {signalsList.map((signal) => (
            <motion.div
              key={signal.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex justify-start"
            >
              <SignalCard signal={signal} />
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="bg-[#17212b] border-t border-[#0e1621] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>متصل به MetaTrader</span>
          </div>
          <span>t.me/behtarinforex</span>
        </div>
      </div>
    </div>
  );
}

function SignalCard({ signal }) {
  const { id, symbol, type, isBuy, openPrice, volume, openTime, status, actions, liveProfit, livePrice, closeProfit } = signal;
  
  const getSymbolName = (sym) => {
    if (sym?.includes('XAU')) return 'Gold';
    if (sym?.includes('XAG')) return 'Silver';
    return sym;
  };

  const bgColor = isBuy 
    ? 'bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-500/30' 
    : 'bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-500/30';

  const currentProfit = status === 'closed' ? closeProfit : liveProfit;
  const isProfitPositive = currentProfit >= 0;
  const hasActions = actions && actions.length > 0;

  return (
    <div dir="ltr" className={`w-[280px] rounded-2xl rounded-tl-md border ${bgColor} overflow-hidden`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 flex-wrap text-left">
          <span className={`text-base ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
            {isBuy ? '🟢' : '🔴'}
          </span>
          <span className="text-white font-bold">{getSymbolName(symbol)}</span>
          <span className={`font-bold text-sm ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
            {isBuy ? 'Buy' : 'Sell'}
          </span>
          <span className="text-gray-400 text-sm">({formatPrice(symbol, openPrice)})</span>
          <span className="text-yellow-500 font-mono text-xs">#{id}</span>
        </div>
      </div>
      
      {/* Volume */}
      <div className="px-3 py-1.5 flex justify-between items-center">
        <span className="text-gray-400 text-xs">Volume</span>
        <span className="font-mono text-white text-sm">{volume} lot</span>
      </div>
      
      {/* Live P/L */}
      {currentProfit !== undefined && currentProfit !== null && (
        <div className="px-3 py-1.5 border-t border-white/5">
          <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg ${isProfitPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <span className="text-gray-300 text-xs">P/L</span>
            <span className={`font-mono font-bold ${isProfitPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isProfitPositive ? '+' : ''}{currentProfit?.toFixed(2)}$
            </span>
          </div>
        </div>
      )}

      {/* Actions - Added as extra lines */}
      {hasActions && (
        <div className="border-t border-white/10">
          {actions.map((action, idx) => (
            <ActionLine key={idx} action={action} symbol={symbol} signalCloseProfit={signal.closeProfit} />
          ))}
        </div>
      )}
      
      {/* Footer */}
      <div className="px-3 py-1 flex justify-between items-center border-t border-white/5">
        <span className={`text-[10px] ${status === 'closed' ? 'text-gray-500' : 'text-green-400'}`}>
          ● {status === 'closed' ? 'Closed' : 'Active'}
        </span>
        <span className="text-[10px] text-gray-500">
          {new Date(openTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function ActionLine({ action, symbol, signalCloseProfit }) {
  const { type, closedVolume, remainingVolume, profit, price, timestamp } = action;
  const isProfit = (profit ?? 0) >= 0;

  if (type === 'partial_close') {
    return (
      <div className="px-3 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">📦</span>
            <span className="text-gray-300">Partial Close</span>
          </div>
          <span className="text-gray-500 text-[10px]">
            {new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-red-400">-{closedVolume} lot</span>
            <span className="text-gray-500">→</span>
            <span className="text-green-400">{remainingVolume} lot</span>
          </div>
          <span className={`font-mono font-bold text-xs ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{profit?.toFixed(2)}$
          </span>
        </div>
      </div>
    );
  }

  if (type === 'closed') {
    // Use signal's total closeProfit from MetaTrader
    const totalPnL = signalCloseProfit ?? profit ?? 0;
    const isTotalProfit = totalPnL >= 0;
    return (
      <div className="px-3 py-2 bg-gray-500/10 border-b border-gray-500/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">✅</span>
            <span className="text-gray-300">Fully Closed</span>
            <span className="text-gray-500">({formatPrice(symbol, price)})</span>
          </div>
          <span className="text-gray-500 text-[10px]">
            {new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center justify-end mt-1">
          <span className={`font-mono font-bold text-sm ${isTotalProfit ? 'text-green-400' : 'text-red-400'}`}>
            Total P/L: {isTotalProfit ? '+' : ''}{totalPnL?.toFixed(2)}$
          </span>
        </div>
      </div>
    );
  }

  return null;
}
