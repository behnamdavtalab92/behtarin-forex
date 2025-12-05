import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme, THEMES } from '../context/ThemeContext';
import { Send, TrendingUp, ChevronRight, Settings, Bell, BellOff, Loader2 } from 'lucide-react';
import { isPushSupported, isSubscribed, subscribeToPush, unsubscribeFromPush } from '../services/pushNotification';

// Logo component with fallback
function Logo() {
  const [imgError, setImgError] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-6"
    >
      {!imgError ? (
        <img 
          src="/logo.png" 
          alt="Behtarin Forex" 
          className="w-24 h-24 rounded-2xl shadow-lg object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        // Fallback: Styled BF logo
        <div className="w-24 h-24 rounded-2xl shadow-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
          <span className="text-white font-bold text-3xl">BF</span>
        </div>
      )}
    </motion.div>
  );
}

const ThemeCard = ({ theme, icon: Icon, label, description, color, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(theme)}
    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 active:bg-white/10 transition-all"
  >
    <div className={`p-3 rounded-xl ${color === 'blue' ? 'bg-blue-500/20' : color === 'green' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
      <Icon size={24} className={`${color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : 'text-yellow-400'}`} />
    </div>
    <div className="flex-1 text-left">
      <div className="text-white font-semibold text-base">{label}</div>
      <div className="text-gray-500 text-xs">{description}</div>
    </div>
    <ChevronRight size={20} className="text-gray-600" />
  </motion.button>
);

export default function Login() {
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSupported, setNotifSupported] = useState(false);

  useEffect(() => {
    // Check notification support and status
    const checkNotifications = async () => {
      const supported = isPushSupported();
      setNotifSupported(supported);
      
      if (supported) {
        const subscribed = await isSubscribed();
        setNotifEnabled(subscribed);
      }
    };
    checkNotifications();
  }, []);

  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    navigate('/dashboard');
  };

  const toggleNotifications = async () => {
    setNotifLoading(true);
    try {
      if (notifEnabled) {
        await unsubscribeFromPush();
        setNotifEnabled(false);
      } else {
        await subscribeToPush();
        setNotifEnabled(true);
      }
    } catch (error) {
      console.error('Notification error:', error);
      alert(error.message || 'خطا در تنظیم نوتیفیکیشن');
    } finally {
      setNotifLoading(false);
    }
  };

  const apps = [
    { 
      id: THEMES.TELEGRAM, 
      label: 'Live Trade', 
      description: 'معاملات زنده - مشاهده لحظه‌ای',
      icon: TrendingUp, 
      color: 'green' 
    },
    { 
      id: THEMES.META5, 
      label: 'Signal Channel', 
      description: 'کانال سیگنال بهترین فارکس',
      icon: Send, 
      color: 'blue' 
    },
  ];

  return (
    <div className="min-h-screen bg-[#0e1621] flex flex-col pt-[env(safe-area-inset-top)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <Logo />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">Behtarin Forex</h1>
          <p className="text-gray-500 text-sm">بهترین فارکس</p>
        </motion.div>

        {/* Theme Options */}
        <div className="w-full max-w-sm space-y-3">
          {apps.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <ThemeCard
                theme={app.id}
                icon={app.icon}
                label={app.label}
                description={app.description}
                color={app.color}
                onClick={handleThemeSelect}
              />
            </motion.div>
          ))}

          {/* Notification Toggle */}
          {notifSupported && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={toggleNotifications}
                disabled={notifLoading}
                className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                  notifEnabled 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className={`p-3 rounded-xl flex-shrink-0 ${notifEnabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                  {notifLoading ? (
                    <Loader2 size={24} className="text-gray-400 animate-spin" />
                  ) : notifEnabled ? (
                    <Bell size={24} className="text-green-400" />
                  ) : (
                    <BellOff size={24} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold text-base">
                    {notifEnabled ? 'نوتیفیکیشن فعال' : 'نوتیفیکیشن غیرفعال'}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {notifEnabled ? 'برای غیرفعال کردن کلیک کنید' : 'برای دریافت اعلان‌ها فعال کنید'}
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all flex-shrink-0 ${notifEnabled ? 'bg-green-500' : 'bg-gray-600'} relative`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${notifEnabled ? 'right-0.5' : 'right-6'}`} />
                </div>
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center justify-between">
        <p className="text-gray-600 text-xs">
          t.me/behtarinforex
        </p>
        <button
          onClick={() => navigate('/admin')}
          className="p-2 rounded-lg hover:bg-white/5 transition"
        >
          <Settings size={18} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}
