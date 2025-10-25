import { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LightNavTheme, DarkNavTheme, SepiaNavTheme } from '@/constants/navigation-theme';
import { ThemeName } from '@/constants/theme';
import { UserPreferences } from '@/constants/user-preferences';

export type AppTheme = ThemeName | 'system';

type ThemeContextType = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<AppTheme>('system');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(UserPreferences.app_theme);
      if (stored) setThemeState(stored as AppTheme);
    })();
  }, []);

  const setTheme = async (newTheme: AppTheme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(UserPreferences.app_theme, newTheme);
  };

  // Compute effective theme for NavigationProvider
  const effectiveTheme =
    theme === 'system'
      ? Appearance.getColorScheme() === 'dark'
        ? DarkNavTheme
        : LightNavTheme
      : theme === 'dark'
        ? DarkNavTheme
        : theme === 'sepia'
          ? SepiaNavTheme
          : LightNavTheme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <NavThemeProvider value={effectiveTheme}>{children}</NavThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook to access theme context
export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return ctx;
};
