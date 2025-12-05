import { useState, useEffect, useCallback } from 'react';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useTradeSocket() {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Dynamically import socket.io-client
    let socketInstance = null;

    const connectSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        
        socketInstance = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        socketInstance.on('connect', () => {
          console.log('🔌 Connected to trade server');
          setConnected(true);
          socketInstance.emit('subscribe');
        });

        socketInstance.on('disconnect', () => {
          console.log('🔌 Disconnected from trade server');
          setConnected(false);
        });

        // Listen for trade updates
        socketInstance.on('trade_update', (payload) => {
          console.log('📊 Trade update received:', payload);
          
          const { event, data } = payload;
          
          // Show notification for all trade events
          const notification = {
            id: Date.now(),
            event,
            data,
            timestamp: new Date().toISOString()
          };

          setNotifications([notification]); // Only 1 notification at a time

          // Play sound
          playNotificationSound(event);
        });

        // Listen for position updates
        socketInstance.on('positions', (positions) => {
          console.log('📊 Positions received:', positions.length);
        });

        setSocket(socketInstance);

      } catch (error) {
        console.error('Socket connection error:', error);
      }
    };

    connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    connected,
    dismissNotification,
    clearAll
  };
}

// Play notification sound
function playNotificationSound(event) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different sounds for different events
    if (event === 'position_opened') {
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
    } else if (event === 'position_closed') {
      oscillator.frequency.value = 600;
      oscillator.type = 'triangle';
    } else {
      oscillator.frequency.value = 500;
      oscillator.type = 'sine';
    }

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Audio not supported
  }
}

export default useTradeSocket;

