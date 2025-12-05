import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = {
  TELEGRAM: 'telegram',
  WHATSAPP: 'whatsapp',
  META5: 'meta5',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.TELEGRAM);

  useEffect(() => {
    // Remove all theme classes
    Object.values(THEMES).forEach(t => document.body.classList.remove(`theme-${t}`));
    // Add current theme class
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

