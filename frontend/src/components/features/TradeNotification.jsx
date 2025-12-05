import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, X, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { calculateSL, calculateTP, formatPrice } from '../../utils/pipCalculator';

// Default pip settings
const DEFAULT_SL_PIPS = 60;
const DEFAULT_TP_PIPS = 150;

export default function TradeNotification({ notifications, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="pointer-events-auto"
          >
            <NotificationCard notification={notif} onDismiss={onDismiss} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationCard({ notification, onDismiss }) {
  const { id, type, event, data, timestamp } = notification;
  
  // No auto dismiss - user must close manually

  const getEventInfo = () => {
    switch (event) {
      case 'position_opened':
        return {
          icon: data.type?.includes('BUY') ? TrendingUp : TrendingDown,
          color: data.type?.includes('BUY') ? 'green' : 'red',
          title: '🚀 معامله جدید باز شد!',
          titleEn: 'New Position Opened!'
        };
      case 'position_closed':
        return {
          icon: CheckCircle,
          color: data.profit >= 0 ? 'green' : 'red',
          title: data.profit >= 0 ? '✅ معامله با سود بسته شد!' : '❌ معامله با ضرر بسته شد!',
          titleEn: data.profit >= 0 ? 'Position Closed (Profit)' : 'Position Closed (Loss)'
        };
      case 'position_updated':
        return {
          icon: AlertCircle,
          color: 'yellow',
          title: '📝 معامله آپدیت شد',
          titleEn: 'Position Updated'
        };
      case 'order_placed':
        return {
          icon: Bell,
          color: 'blue',
          title: '📋 سفارش ثبت شد',
          titleEn: 'Order Placed'
        };
      default:
        return {
          icon: Bell,
          color: 'gray',
          title: 'Trade Update',
          titleEn: 'Trade Update'
        };
    }
  };

  const info = getEventInfo();
  const Icon = info.icon;
  const isBuy = data.type?.includes('BUY');

  // Calculate SL/TP if not provided
  const entryPrice = parseFloat(data.openPrice) || 0;
  const calculatedSL = data.stopLoss || calculateSL(data.symbol, entryPrice, data.type, DEFAULT_SL_PIPS);
  const calculatedTP = data.takeProfit || calculateTP(data.symbol, entryPrice, data.type, DEFAULT_TP_PIPS);

  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/30 text-green-500',
    red: 'bg-red-500/10 border-red-500/30 text-red-500',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    gray: 'bg-gray-500/10 border-gray-500/30 text-gray-500'
  };

  return (
    <div className={`bg-[#1a1a1a] border ${colorClasses[info.color].split(' ')[1]} rounded-xl shadow-2xl overflow-hidden backdrop-blur-lg`}>
      {/* Header */}
      <div className={`px-4 py-2 flex items-center justify-between ${colorClasses[info.color].split(' ')[0]}`}>
        <div className="flex items-center gap-2">
          <Icon size={18} className={colorClasses[info.color].split(' ')[2]} />
          <span className="font-bold text-sm text-white">{info.title}</span>
        </div>
        <button 
          onClick={() => onDismiss(id)}
          className="p-1 hover:bg-white/10 rounded transition"
        >
          <X size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Symbol & Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-white">{data.symbol}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isBuy ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              {isBuy ? 'BUY' : 'SELL'}
            </span>
          </div>
          {data.volume && (
            <span className="text-sm text-gray-400 font-mono">{data.volume} lot</span>
          )}
        </div>

        {/* Price Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Entry */}
          <div className="bg-black/40 rounded-lg p-2 border border-white/10">
            <div className="text-gray-400 text-[10px] uppercase mb-1">Entry</div>
            <div className="font-mono text-white font-bold">
              {formatPrice(data.symbol, entryPrice)}
            </div>
          </div>
          
          {/* SL */}
          <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
            <div className="text-red-400 text-[10px] uppercase mb-1 flex items-center justify-between">
              <span>SL</span>
              <span className="text-[8px] text-red-300">{DEFAULT_SL_PIPS} pip</span>
            </div>
            <div className="font-mono text-red-400 font-bold">
              {formatPrice(data.symbol, calculatedSL)}
            </div>
          </div>
          
          {/* TP */}
          <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
            <div className="text-green-400 text-[10px] uppercase mb-1 flex items-center justify-between">
              <span>TP</span>
              <span className="text-[8px] text-green-300">{DEFAULT_TP_PIPS} pip</span>
            </div>
            <div className="font-mono text-green-400 font-bold">
              {formatPrice(data.symbol, calculatedTP)}
            </div>
          </div>
        </div>

        {/* Current Price & Profit (for updates and closed) */}
        {data.profit !== undefined && (
          <div className={`text-center py-2 rounded-lg ${data.profit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {data.currentPrice && (
              <div className="text-xs text-gray-400 mb-1">
                Current: <span className="text-yellow-500 font-mono">{formatPrice(data.symbol, data.currentPrice)}</span>
              </div>
            )}
            <span className={`font-mono font-bold text-lg ${data.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {data.profit >= 0 ? '+' : ''}{data.profit?.toFixed(2)}$
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-[10px] text-gray-500 text-right">
          {new Date(timestamp).toLocaleTimeString('fa-IR')}
        </div>
      </div>

    </div>
  );
}
