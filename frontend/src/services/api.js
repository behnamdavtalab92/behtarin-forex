const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get all trades data
export async function getTradesData() {
  try {
    const response = await fetch(`${API_URL}/trades/all`);
    if (!response.ok) throw new Error('Failed to fetch trades');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

// Get open positions
export async function getPositions() {
  try {
    const response = await fetch(`${API_URL}/trades/positions`);
    if (!response.ok) throw new Error('Failed to fetch positions');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}

// Get account info
export async function getAccountInfo() {
  try {
    const response = await fetch(`${API_URL}/trades/account`);
    if (!response.ok) throw new Error('Failed to fetch account');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

// Get trade history
export async function getTradeHistory(days = 7) {
  try {
    const response = await fetch(`${API_URL}/trades/history?days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}

// Health check
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return await response.json();
  } catch (error) {
    return { status: 'error', metaTrader: 'disconnected' };
  }
}

// Get Telegram channel info
export async function getTelegramChannelInfo() {
  try {
    const response = await fetch(`${API_URL}/telegram/channel`);
    if (!response.ok) throw new Error('Failed to fetch channel info');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

// Get Telegram channel messages
export async function getTelegramMessages(limit = 20) {
  try {
    const response = await fetch(`${API_URL}/telegram/messages?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}
