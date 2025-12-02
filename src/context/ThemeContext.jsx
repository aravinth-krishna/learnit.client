import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load from localStorage or default to false
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (enabled) => {
    setIsDarkMode(enabled);
  };

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleDarkMode,
      setDarkMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
