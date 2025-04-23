import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme) {
          setThemeMode(savedTheme as 'light' | 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    try {
      await AsyncStorage.setItem('themeMode', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 