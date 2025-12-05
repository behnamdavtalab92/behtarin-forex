// Pip calculator utility

// Get pip value for different symbols
export function getPipValue(symbol) {
  const sym = symbol?.toUpperCase() || '';
  
  // Gold (XAU)
  if (sym.includes('XAU')) {
    return 0.1; // 1 pip = $0.1 for gold
  }
  
  // JPY pairs
  if (sym.includes('JPY')) {
    return 0.01; // 1 pip = 0.01 for JPY
  }
  
  // Standard forex pairs
  return 0.0001; // 1 pip = 0.0001
}

// Calculate SL price
export function calculateSL(symbol, entryPrice, type, pips = 60) {
  const pipValue = getPipValue(symbol);
  const isBuy = type?.toUpperCase().includes('BUY');
  
  if (isBuy) {
    // BUY: SL is below entry
    return entryPrice - (pips * pipValue);
  } else {
    // SELL: SL is above entry
    return entryPrice + (pips * pipValue);
  }
}

// Calculate TP price
export function calculateTP(symbol, entryPrice, type, pips = 150) {
  const pipValue = getPipValue(symbol);
  const isBuy = type?.toUpperCase().includes('BUY');
  
  if (isBuy) {
    // BUY: TP is above entry
    return entryPrice + (pips * pipValue);
  } else {
    // SELL: TP is below entry
    return entryPrice - (pips * pipValue);
  }
}

// Get decimal places for formatting
export function getDecimalPlaces(symbol) {
  const sym = symbol?.toUpperCase() || '';
  
  if (sym.includes('XAU')) return 2;
  if (sym.includes('JPY')) return 3;
  return 5;
}

// Format price with correct decimals
export function formatPrice(symbol, price) {
  const decimals = getDecimalPlaces(symbol);
  return price?.toFixed(decimals) || '---';
}

// Calculate pips between two prices
export function calculatePips(symbol, price1, price2) {
  const pipValue = getPipValue(symbol);
  return Math.abs(price1 - price2) / pipValue;
}

export default {
  getPipValue,
  calculateSL,
  calculateTP,
  getDecimalPlaces,
  formatPrice,
  calculatePips
};

