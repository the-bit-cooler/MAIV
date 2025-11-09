import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Appearance } from 'react-native';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';

import { AppDefaults } from '@/constants/app-defaults';
import { DarkNavTheme, LightNavTheme, SepiaNavTheme } from '@/constants/navigation-theme';
import { ThemeName } from '@/constants/theme';
import { UserPreferences } from '@/constants/user-preferences';
import { ReadingLocation } from '@/types/reading-location';
import { getCache, setCache } from '@/utilities/cache';
import { constructAPIUrl } from '@/utilities/construct-api-url';

export type AppTheme = ThemeName | 'system';

type AppContextType = {
  readingLocation: ReadingLocation;
  setReadingLocation: (location: ReadingLocation) => Promise<void>;

  sessionToken: string | null;
  setSessionToken: (token: string | null) => Promise<void>;

  aiMode: string;
  setAiMode: (mode: string) => Promise<void>;

  allowAiThinkingSound: boolean;
  setAllowAiThinkingSound: (value: boolean) => Promise<void>;

  theme: AppTheme;
  setTheme: (theme: AppTheme) => Promise<void>;

  verseToPageMap: Record<number, number>;
  setVerseToPageMap: (map: Record<number, number>) => void;

  totalChapterVerseCount: number;
  setTotalChapterVerseCount: (count: number) => void;

  isAppReady: boolean; // 🔹 expose readiness state
};

const defaultReadingLocation: ReadingLocation = {
  drawerSelection: AppDefaults.drawerSelection,
  bible: {
    book: AppDefaults.bibleBook,
    chapter: 1,
    page: 0,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [readingLocation, setReadingLocationState] =
    useState<ReadingLocation>(defaultReadingLocation);
  const [sessionToken, setSessionTokenState] = useState<string | null>(null);
  const [aiMode, setAiModeState] = useState(AppDefaults.aiMode);
  const [allowAiThinkingSound, setAllowAiThinkingSoundState] = useState(
    AppDefaults.allowAiThinkingSound,
  );
  const [theme, setThemeState] = useState<AppTheme>('sepia');
  const [verseToPageMap, setVerseToPageMap] = useState<Record<number, number>>({});
  const [totalChapterVerseCount, setTotalChapterVerseCount] = useState<number>(0);
  const [isAppReady, setIsAppReady] = useState(false);

  // === Load cached data and session ===
  useEffect(() => {
    (async () => {
      try {
        // Run all async loads in parallel
        const [storedLoc, storedAiMode, storedSound, storedTheme] = await Promise.all([
          getCache<ReadingLocation>(UserPreferences.saved_reading_location),
          getCache<string>(UserPreferences.ai_mode),
          getCache<boolean>(UserPreferences.ai_thinking_sound),
          getCache<AppTheme>(UserPreferences.app_theme),
        ]);

        if (storedLoc) setReadingLocationState(storedLoc);
        if (storedAiMode) setAiModeState(storedAiMode);
        setAllowAiThinkingSoundState(storedSound ?? true);
        if (storedTheme) setThemeState(storedTheme);

        // 🔹 Check for existing session token
        const storedToken = await SecureStore.getItemAsync(UserPreferences.session_token);
        if (storedToken) {
          const apiUrl = constructAPIUrl(`validate-login-session`);
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            setSessionTokenState(storedToken);
          } else if (response.status === 401) {
            await SecureStore.deleteItemAsync(UserPreferences.session_token);
            setSessionTokenState(null);
            Alert.alert(
              'Session Expired ⏰',
              'Your secure MAIV session has expired. Please sign in again.',
            );
          }
        }
      } catch {
        Alert.alert(
          'Connection Problem 🚫',
          'Unable to reach our servers. Please check your internet connection and try again.',
        );
      } finally {
        setIsAppReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // Give the JS thread one frame to render the first view before hiding
      requestAnimationFrame(async () => {
        await SplashScreen.hideAsync();
      });
    }
  }, [isAppReady]);

  // === Setters that persist ===
  const setReadingLocation = async (value: ReadingLocation) => {
    setReadingLocationState(value);
    await setCache(UserPreferences.saved_reading_location, value);
  };

  const setSessionToken = async (token: string | null) => {
    setSessionTokenState(token);
    if (token) await SecureStore.setItemAsync(UserPreferences.session_token, token);
    else await SecureStore.deleteItemAsync(UserPreferences.session_token);
  };

  const setAiMode = async (mode: string) => {
    setAiModeState(mode);
    await setCache(UserPreferences.ai_mode, mode);
  };

  const setAllowAiThinkingSound = async (value: boolean) => {
    setAllowAiThinkingSoundState(value);
    await setCache(UserPreferences.ai_thinking_sound, value);
  };

  const setTheme = async (value: AppTheme) => {
    setThemeState(value);
    await setCache(UserPreferences.app_theme, value);
  };

  // === Compute Navigation theme ===
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

  const value: AppContextType = {
    readingLocation,
    setReadingLocation,
    sessionToken,
    setSessionToken,
    aiMode,
    setAiMode,
    allowAiThinkingSound,
    setAllowAiThinkingSound,
    theme,
    setTheme,
    verseToPageMap,
    setVerseToPageMap,
    totalChapterVerseCount,
    setTotalChapterVerseCount,
    isAppReady,
  };

  return (
    <ActionSheetProvider>
      <AppContext.Provider value={value}>
        <NavThemeProvider value={effectiveTheme}>
          {isAppReady ? children : null /* or a <SplashScreen /> */}
        </NavThemeProvider>
      </AppContext.Provider>
    </ActionSheetProvider>
  );
};

// === Hook ===
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
