import { useTheme, THEMES } from '../context/ThemeContext';
import SignalTracker from '../components/features/SignalTracker';
import TelegramChannel from '../components/features/TelegramChannel';

export default function Dashboard() {
  const { theme } = useTheme();

  return (
    <div className="bg-[#0e1621] min-h-screen w-full flex justify-center items-start">
      <div className="min-h-screen w-full max-w-lg mx-auto overflow-hidden bg-[#0e1621]">
        
        {/* TELEGRAM = Live Trade */}
        {theme === THEMES.TELEGRAM && (
          <SignalTracker />
        )}

        {/* META5 = Signal Channel */}
        {theme === THEMES.META5 && (
          <TelegramChannel />
        )}

      </div>
    </div>
  );
}
