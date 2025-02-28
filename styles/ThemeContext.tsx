// ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const COLORS = {
  light: {
    primary: '#ffbb00',
    secondary: '#4F5D73',
    tertiary: '#76C2AF',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#231F20',
    textSecondary: '#666666',
    border: '#E0E0D1',
    button: '#F5CF87',
    buttonText: '#231F20',
    error: '#FF3B30',
  },
  dark: {
    primary: '#F5CF87',
    secondary: '#4F5D73',
    tertiary: '#76C2AF',
    background: '#231F20',
    surface: '#333333',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    border: '#444444',
    button: '#F5CF87',
    buttonText: '#231F20',
    error: '#FF3B30',
  },
};

type ThemeType = 'light' | 'dark' | 'system';
type ThemeContextType = {
  theme: ThemeType;
  colors: typeof COLORS.light;
  setTheme: (theme: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (
          savedTheme &&
          (savedTheme === 'light' ||
            savedTheme === 'dark' ||
            savedTheme === 'system')
        ) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };

    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const colorScheme = theme === 'system' ? systemColorScheme || 'light' : theme;

  const colors = COLORS[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
