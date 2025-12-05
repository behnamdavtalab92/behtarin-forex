import { useState } from 'react';
import { Calculator, Heart, MessageCircle, Share2, MoreHorizontal, Target, ArrowUpRight, ArrowDownRight, Clock, X, MousePointer2, Minus, Hash, PenTool, Type, Eye, Send, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEMES } from '../../context/ThemeContext';
import TradingViewChart from './TradingViewChart';

export default function SignalCard({ signal, theme }) {
  const [showCalc, setShowCalc] = useState(false);
  const [lotSize, setLotSize] = useState(0.1);
  const [risk, setRisk] = useState(null);
  const [chartError, setChartError] = useState(false);

  const calculateRisk = () => {
    let entryVal = parseFloat(signal.entry);
    if (isNaN(entryVal)) {
       const parts = signal.entry.toString().split('-');
       if (parts.length > 1) entryVal = (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
       else entryVal = parseFloat(signal.entry.toString().replace(/[^0-9.]/g, ''));
    }
    let pipDiff = Math.abs(entryVal - signal.stopLoss);
    let estimatedRisk = 0;
    if (signal.symbol.includes('XAU')) estimatedRisk = pipDiff * lotSize * 100; 
    else if (signal.symbol.includes('JPY')) estimatedRisk = (pipDiff * lotSize * 100000) / entryVal; 
    else estimatedRisk = pipDiff * lotSize * 100000;
    setRisk(estimatedRisk.toFixed(2));
  };

  const isBuy = signal.type === 'BUY';

  // --- 1. TELEGRAM ---
  if (theme === THEMES.TELEGRAM) {
    const reactionSet = [
      { emoji: '⭐️', value: signal.reactions?.star ?? 6 },
      { emoji: '🔥', value: signal.reactions?.fire ?? 2 },
      { emoji: '❤️', value: signal.reactions?.heart ?? 1 },
      { emoji: '🙏', value: signal.reactions?.pray ?? 1 },
    ];
    const persianTargets = signal.targets ? signal.targets.map((t, idx) => `تارگت ${idx + 1}: ${t}`) : [`تارگت: ${signal.takeProfit}`];

    return (
      <div className="flex justify-start w-full px-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-[96%] md:max-w-[85%] ml-1 rounded-[28px] rounded-bl-lg border border-white/10 bg-gradient-to-br from-[#451939] via-[#2d0f25] to-[#150812] text-white shadow-[0_20px_60px_rgba(7,5,15,0.8)] overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),transparent)]"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-screen"></div>
          <div className="relative p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide font-semibold text-white/80">
              <div className="flex items-center gap-2"><span>سیگنال فارکس و طلا</span><span className="px-2 py-0.5 rounded-full bg-white/15 text-[#ffd166] text-[10px]">VIP</span></div>
              <span className="text-white/60">{signal.time}</span>
            </div>
            <div className="text-sm leading-6 font-medium">
              <div>▪️ نماد معاملاتی: <b>{signal.symbol}</b></div>
              <div>▪️ نوع معامله: {isBuy ? '🟢 خرید' : '🔴 فروش'}</div>
              <div>▪️ نقاط ورود: <b className="font-mono">{signal.entry}</b></div>
              <div>▪️ استاپ لاس: <b className="font-mono text-red-300">{signal.stopLoss}</b></div>
              {persianTargets.map((line, idx) => <div key={idx}>▪️ {line}</div>)}
            </div>
            <button className="w-full text-left text-xs text-[#8ec5ff] bg-white/5 border border-white/10 rounded-2xl px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition"><span className="text-[10px] uppercase tracking-wide">t.me/behtarinforex</span></button>
            <div className="flex flex-wrap gap-2 text-[11px]">{reactionSet.map(r => <div key={r.emoji} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur"><span>{r.emoji}</span><span>{r.value}</span></div>)}</div>
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <div className="flex items-center gap-1"><Eye size={14} /> <span>{signal.views ?? 364}</span></div>
              <button onClick={() => setShowCalc(!showCalc)} className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 transition"><Send size={14} /><span>ارسال</span></button>
            </div>
          </div>
          <AnimatePresence>{showCalc && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-4"><RiskCalculator lotSize={lotSize} setLotSize={setLotSize} calculateRisk={calculateRisk} risk={risk} theme={theme} /></motion.div>}</AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // --- 2. WHATSAPP ---
  if (theme === THEMES.WHATSAPP) {
    return (
      <div className="bg-[#d9fdd3] rounded-lg p-2 shadow-sm max-w-[85%] ml-auto mb-2 relative text-sm border border-[#c8e6c9]">
          <div className="font-bold text-[#008069] mb-1 flex justify-between"><span>{signal.symbol}</span><span className={isBuy ? 'text-green-600' : 'text-red-600'}>{signal.type}</span></div>
          <div className="space-y-0.5 text-gray-800 mb-1">
          <div className="flex gap-2"><span>🏁 Entry:</span> <span className="font-mono font-bold">{signal.entry}</span></div>
          <div className="flex gap-2"><span>🛑 SL:</span> <span className="font-mono font-bold">{signal.stopLoss}</span></div>
          {signal.targets ? (<div className="mt-1 border-l-2 border-green-500 pl-2">{signal.targets.map((t, i) => <div key={i} className="text-xs">✅ TP{i+1}: <b>{t}</b></div>)}</div>) : (<div className="flex gap-2"><span>✅ TP:</span> <span className="font-mono font-bold">{signal.takeProfit}</span></div>)}
          </div>
          <div className="flex justify-end items-center gap-2 mt-1">
          <button onClick={() => setShowCalc(!showCalc)} className="text-[10px] bg-white/50 px-2 py-0.5 rounded text-gray-600 uppercase font-medium">Calc Risk</button>
          <span className="text-[10px] text-gray-500">{signal.time}</span>
          </div>
          <AnimatePresence>{showCalc && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden mt-2"><RiskCalculator lotSize={lotSize} setLotSize={setLotSize} calculateRisk={calculateRisk} risk={risk} theme={theme} /></motion.div>}</AnimatePresence>
      </div>
    );
  }

  // --- 3. META5 (Custom Chart) ---
  if (theme === THEMES.META5) {
    // Generate candle data
    const candles = [
      { h: 35, up: true, wickTop: 8, wickBottom: 5 },
      { h: 28, up: false, wickTop: 6, wickBottom: 7 },
      { h: 42, up: true, wickTop: 10, wickBottom: 6 },
      { h: 38, up: true, wickTop: 7, wickBottom: 8 },
      { h: 32, up: false, wickTop: 9, wickBottom: 5 },
      { h: 45, up: true, wickTop: 12, wickBottom: 7 },
      { h: 40, up: false, wickTop: 6, wickBottom: 9 },
      { h: 50, up: true, wickTop: 11, wickBottom: 6 },
      { h: 33, up: false, wickTop: 7, wickBottom: 8 },
      { h: 47, up: true, wickTop: 9, wickBottom: 5 },
    ];

    return (
      <div className="bg-black text-white border-b border-[#1f1f1f] mb-4 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 flex justify-between items-center bg-[#101010]">
           <div className="flex items-center gap-3">
              <div className="font-bold text-lg">{signal.symbol}</div>
              <div className={`text-xs font-bold px-2 py-0.5 rounded ${isBuy ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{signal.type}</div>
           </div>
           <div className="text-xs text-gray-500">{signal.time}</div>
        </div>

        {/* TradingView Chart */}
        <TradingViewChart signal={signal} />

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-px bg-[#1f1f1f] border-t border-[#1f1f1f]">
           <div className="bg-black p-3 text-center">
              <div className="text-gray-500 text-[10px] uppercase">Entry</div>
              <div className="text-white font-mono text-sm">{signal.entry}</div>
           </div>
           <div className="bg-black p-3 text-center">
              <div className="text-red-500 text-[10px] uppercase">Stop Loss</div>
              <div className="text-red-400 font-mono text-sm">{signal.stopLoss}</div>
           </div>
           <div className="bg-black p-3 text-center">
              <div className="text-green-500 text-[10px] uppercase">Take Profit</div>
              <div className="text-green-400 font-mono text-sm">{signal.targets ? signal.targets[0] : signal.takeProfit}</div>
           </div>
        </div>

        {/* Actions */}
        <div className="p-3 flex justify-between items-center bg-black">
           <button onClick={() => setShowCalc(!showCalc)} className="text-[#00aeff] text-xs flex items-center gap-1 hover:bg-[#1f1f1f] px-3 py-1 rounded">
              <Calculator size={14} /> Calculate Risk
           </button>
           <div className="flex items-center gap-4 text-gray-500">
              <div className="flex items-center gap-1 text-xs"><Heart size={14} /> {signal.likes ?? 240}</div>
              <div className="flex items-center gap-1 text-xs"><Share2 size={14} /> Share</div>
           </div>
        </div>

        <AnimatePresence>{showCalc && <motion.div initial={{height:0}} animate={{height:'auto'}} className="overflow-hidden bg-[#111] border-t border-[#1f1f1f] px-3 pb-3"><RiskCalculator lotSize={lotSize} setLotSize={setLotSize} calculateRisk={calculateRisk} risk={risk} theme={theme} /></motion.div>}</AnimatePresence>
      </div>
    );
  }

  // Default fallback
  return <div className="bg-white p-4 rounded border">Default</div>;
}

function RiskCalculator({ lotSize, setLotSize, calculateRisk, risk, theme }) {
  const isDark = theme === THEMES.META5;
  const btnClass = theme === THEMES.META5 ? 'bg-[#007aff] text-white' : 'bg-blue-500 text-white';
  const inputClass = isDark ? 'bg-[#131722] border-[#363a45] text-white' : 'bg-white border-gray-300';

  return (
    <div className={`p-3 rounded ${isDark ? 'bg-transparent' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className={`text-[10px] uppercase ${isDark ? 'text-[#6b6b6b]' : 'text-gray-500'}`}>Volume</label>
        <input type="number" step="0.01" value={lotSize} onChange={(e) => setLotSize(parseFloat(e.target.value))} className={`w-16 px-2 py-1 text-sm rounded border ${inputClass} focus:outline-none`} />
      </div>
      <button onClick={calculateRisk} className={`w-full py-1.5 rounded text-xs font-bold uppercase tracking-wide ${btnClass}`}>Calculate</button>
      {risk && (
        <div className="mt-2 flex justify-between items-center text-sm">
          <span className={isDark ? 'text-[#888]' : 'text-gray-500'}>Risk:</span>
          <span className="font-bold text-[#f23645]">${risk}</span>
        </div>
      )}
    </div>
  );
}
