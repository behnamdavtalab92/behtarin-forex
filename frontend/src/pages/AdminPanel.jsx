import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, TrendingUp, TrendingDown, MessageSquare, Zap, Lock, Check, X, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signal'); // 'signal' or 'message'
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Signal form
  const [signal, setSignal] = useState({
    symbol: 'XAUUSD',
    tradeType: 'buy',
    entries: '',
    stopLoss: '',
    targets: '',
  });

  // Message form
  const [message, setMessage] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password.length > 0) {
      setIsAuthenticated(true);
    }
  };

  const sendSignal = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/telegram/send-signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...signal, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult({ type: 'success', text: 'سیگنال با موفقیت ارسال شد ✅' });
        setSignal({ symbol: 'XAUUSD', tradeType: 'buy', entries: '', stopLoss: '', targets: '' });
      } else {
        setResult({ type: 'error', text: data.error || 'خطا در ارسال' });
      }
    } catch (error) {
      setResult({ type: 'error', text: 'خطا در اتصال به سرور' });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/telegram/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult({ type: 'success', text: 'پیام با موفقیت ارسال شد ✅' });
        setMessage('');
      } else {
        setResult({ type: 'error', text: data.error || 'خطا در ارسال' });
      }
    } catch (error) {
      setResult({ type: 'error', text: 'خطا در اتصال به سرور' });
    } finally {
      setLoading(false);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0e1621] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-blue-400" />
            </div>
            <h1 className="text-white text-xl font-bold">پنل مدیریت</h1>
            <p className="text-gray-500 text-sm mt-1">رمز عبور را وارد کنید</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور"
              className="w-full bg-[#17212b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              dir="ltr"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition"
            >
              ورود
            </button>
          </form>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full mt-4 text-gray-500 text-sm hover:text-gray-400"
          >
            بازگشت
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1621] safe-top">
      {/* Header */}
      <div className="bg-[#17212b] text-white p-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="p-1 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft size={22} className="text-gray-400" />
          </button>
          <div>
            <div className="font-bold text-[15px]">🔐 پنل مدیریت</div>
            <div className="text-[11px] text-gray-400">ارسال پیام به کانال</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('signal')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition ${
            activeTab === 'signal' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500'
          }`}
        >
          <Zap size={16} /> سیگنال
        </button>
        <button
          onClick={() => setActiveTab('message')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition ${
            activeTab === 'message' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500'
          }`}
        >
          <MessageSquare size={16} /> پیام
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Result Message */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl flex items-center gap-2 ${
              result.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {result.type === 'success' ? <Check size={18} /> : <X size={18} />}
            <span className="text-sm">{result.text}</span>
          </motion.div>
        )}

        {activeTab === 'signal' ? (
          /* Signal Form */
          <div className="space-y-4">
            {/* Symbol */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">نماد</label>
              <select
                value={signal.symbol}
                onChange={(e) => setSignal({ ...signal, symbol: e.target.value })}
                className="w-full bg-[#17212b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="XAUUSD">XAUUSD (طلا)</option>
                <option value="EURUSD">EURUSD (یورو/دلار)</option>
                <option value="GBPUSD">GBPUSD (پوند/دلار)</option>
                <option value="XAGUSD">XAGUSD (نقره)</option>
                <option value="USDJPY">USDJPY (دلار/ین)</option>
              </select>
            </div>

            {/* Trade Type */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">نوع معامله</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSignal({ ...signal, tradeType: 'buy' })}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition ${
                    signal.tradeType === 'buy'
                      ? 'bg-green-500 text-white'
                      : 'bg-[#17212b] text-gray-400 border border-white/10'
                  }`}
                >
                  <TrendingUp size={18} /> خرید (BUY)
                </button>
                <button
                  onClick={() => setSignal({ ...signal, tradeType: 'sell' })}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition ${
                    signal.tradeType === 'sell'
                      ? 'bg-red-500 text-white'
                      : 'bg-[#17212b] text-gray-400 border border-white/10'
                  }`}
                >
                  <TrendingDown size={18} /> فروش (SELL)
                </button>
              </div>
            </div>

            {/* Entry Points */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">نقاط ورود</label>
              <input
                type="text"
                value={signal.entries}
                onChange={(e) => setSignal({ ...signal, entries: e.target.value })}
                placeholder="مثال: 2650 و 2648"
                className="w-full bg-[#17212b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">استاپ لاس</label>
              <input
                type="text"
                value={signal.stopLoss}
                onChange={(e) => setSignal({ ...signal, stopLoss: e.target.value })}
                placeholder="مثال: 2645"
                className="w-full bg-[#17212b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
            </div>

            {/* Targets */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">تارگت‌ها (با کاما جدا کنید)</label>
              <input
                type="text"
                value={signal.targets}
                onChange={(e) => setSignal({ ...signal, targets: e.target.value })}
                placeholder="مثال: 2655, 2660, 2665, 2670"
                className="w-full bg-[#17212b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={sendSignal}
              disabled={loading || !signal.entries || !signal.stopLoss || !signal.targets}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-medium py-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Send size={18} /> ارسال سیگنال
                </>
              )}
            </button>
          </div>
        ) : (
          /* Message Form */
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">متن پیام</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="متن پیام خود را بنویسید..."
                rows={6}
                className="w-full bg-[#17212b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                dir="rtl"
              />
            </div>

            {/* Quick Messages */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">پیام‌های سریع</label>
              <div className="flex flex-wrap gap-2">
                {[
                  '✅ تارگت ۱ زده شد!',
                  '✅ تارگت ۲ زده شد!',
                  '❌ استاپ زده شد',
                  '📊 در حال بررسی بازار...',
                  '🔒 استاپ به ورود منتقل شد',
                ].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => setMessage(message + (message ? '\n' : '') + quick)}
                    className="px-3 py-1.5 bg-[#17212b] border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/5"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-medium py-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Send size={18} /> ارسال پیام
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

