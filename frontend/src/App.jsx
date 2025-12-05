import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import TradeNotification from './components/features/TradeNotification';
import { useTradeSocket } from './hooks/useTradeSocket';

function AppContent() {
  const { notifications, connected, dismissNotification } = useTradeSocket();

  return (
    <div className="antialiased">
      {/* Global Trade Notifications */}
      <TradeNotification 
        notifications={notifications} 
        onDismiss={dismissNotification} 
      />
      
      {/* Connection Status Indicator */}
      {connected && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-green-500/20 text-green-500 text-xs px-3 py-1.5 rounded-full border border-green-500/30">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live Connected
        </div>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
