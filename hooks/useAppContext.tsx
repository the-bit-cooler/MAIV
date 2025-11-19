import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Appearance, AppState } from 'react-native';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';

import {
  AppDefaults,
  CacheKeys,
  DarkNavTheme,
  LightNavTheme,
  SepiaNavTheme,
  ThemeName,
} from '@/constants';
import type { ReadingLocation } from '@/types';
import { getCache, setCache } from '@/utilities';

export type AppTheme = ThemeName | 'system';

type AppContextType = {
  readingLocation: ReadingLocation;
  setReadingLocation: (location: Partial<ReadingLocationUpdate>) => Promise<void>;

  sessionToken: string | null;
  setSessionToken: (token: string | null) => Promise<void>;

  aiMode: string;
  setAiMode: (mode: string) => Promise<void>;

  aiThinkingSoundEnabled: boolean;
  setAiThinkingSoundEnabled: (value: boolean) => Promise<void>;

  theme: AppTheme;
  setTheme: (theme: AppTheme) => Promise<void>;

  isAppReady: boolean;

  constructApiUrl: ({ segments }: ApiUrl) => string;
  constructStorageUrl: ({ type, version, book, chapter, verse, aiMode, ext }: StorageUrl) => string;
  constructStorageKey: ({ type, version, book, chapter, verse, aiMode }: StorageKey) => string;
};

type ApiUrl = {
  segments: (string | number | undefined)[];
};

type StorageUrl = {
  type: 'summary' | 'explanation' | 'illustration' | 'translation';
  version?: string;
  book: string;
  chapter: number | string;
  verse?: number | string;
  aiMode?: string;
  ext: 'txt' | 'png';
};

type StorageKey = {
  type: 'pages' | 'summary' | 'explanation' | 'translation';
  version?: string;
  book?: string;
  chapter?: number | string;
  verse?: number | string;
  aiMode?: string;
};

type ReadingLocationUpdate = {
  bible?: Partial<ReadingLocation['bible']>;
} & Partial<Omit<ReadingLocation, 'bible'>>;

const defaultReadingLocation: ReadingLocation = {
  drawerSelection: AppDefaults.drawerSelection,
  bible: {
    book: AppDefaults.bibleBook,
    chapter: 1,
    page: 1,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [readingLocation, setReadingLocationState] =
    useState<ReadingLocation>(defaultReadingLocation);
  const [sessionToken, setSessionTokenState] = useState<string | null>(null);
  const [aiMode, setAiModeState] = useState(AppDefaults.aiMode);
  const [aiThinkingSoundEnabled, setAiThinkingSoundEnabledState] = useState(
    AppDefaults.aiThinkingSoundEnabled,
  );
  const [theme, setThemeState] = useState<AppTheme>(AppDefaults.theme);
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());
  const [isAppReady, setIsAppReady] = useState(false);

  const constructApiUrl = useCallback(({ segments }: ApiUrl) => {
    const base = process.env.EXPO_PUBLIC_AZURE_FUNCTION_URL!;
    const fnKey = process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY!;

    const path = segments.filter(Boolean).join('/');

    return `${base}${path}?code=${fnKey}`;
  }, []);

  const constructStorageUrl = useCallback(
    ({ type, version, book, chapter, verse, aiMode, ext }: StorageUrl) => {
      const base = process.env.EXPO_PUBLIC_AZURE_STORAGE_URL!;
      const cleanBook = book.replace(/ /g, '');

      // Build ordered path pieces (skips undefined automatically)
      const pieces = [type, version, cleanBook, chapter, verse, aiMode].filter(Boolean);

      return `${base}${pieces.join('/')}.${ext}`;
    },
    [],
  );

  const constructStorageKey = useCallback(
    ({ type, version, book, chapter, verse, aiMode }: StorageKey) => {
      const parts: (string | number | undefined)[] = [type, version, book, chapter, verse, aiMode];

      // Filter out undefined values
      const compact = parts.filter(Boolean);

      // Join with colon
      return compact.join(':');
    },
    [],
  );

  // === Listen for OS-level theme changes ===
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => listener.remove();
  }, []);

  // === Listen for OS-level theme changes ===
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setSystemColorScheme(Appearance.getColorScheme());
      }
    });
    return () => sub.remove();
  }, []);

  // === Load cached data and session ===
  useEffect(() => {
    async function loadCachedState() {
      try {
        // Run all async loads in parallel
        const [storedLoc, storedAiMode, storedSound, storedTheme, storedToken] = await Promise.all([
          getCache<ReadingLocation>(CacheKeys.reading_location),
          getCache<string>(CacheKeys.ai_mode),
          getCache<boolean>(CacheKeys.ai_thinking_sound_enabled),
          getCache<AppTheme>(CacheKeys.app_theme),
          SecureStore.getItemAsync(CacheKeys.session_token),
        ]);

        if (storedLoc) setReadingLocationState(storedLoc);
        if (storedAiMode) setAiModeState(storedAiMode);
        if (storedSound) setAiThinkingSoundEnabledState(storedSound);
        if (storedTheme) setThemeState(storedTheme);

        // 🔹 Validate session token if it exists
        if (storedToken) {
          const apiUrl = constructApiUrl({ segments: [`validate-login-session`] });
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            // Just set state, no need to store again
            setSessionTokenState(storedToken);
          } else if (response.status === 401) {
            // Clear state and stored token
            await setSessionToken(null);
            Alert.alert(
              'Session Expired ⏰',
              'Your secure MAIV session has expired. Please sign in again.',
            );
          }
        }
      } catch (error) {
        console.error('AppProvider.useEffect() => loadCachedState()', error);

        Alert.alert(
          'Connection Problem 🚫',
          'Unable to reach our servers. Please check your internet connection and try again.',
        );
      } finally {
        setIsAppReady(true);
      }
    }

    loadCachedState();
  }, [constructApiUrl]);

  // === Hide splash screen when app context is ready ===
  useEffect(() => {
    async function hideSplashScreen() {
      try {
        if (isAppReady) {
          // Give the JS thread one frame to render the first view before hiding
          requestAnimationFrame(async () => {
            await SplashScreen.hideAsync();
          });
        }
      } catch (error) {
        console.error('AppProvider.useEffect() => hideSplashScreen()', error);
      }
    }

    hideSplashScreen();
  }, [isAppReady]);

  // === Setters that persist ===
  const setReadingLocation = async (partial: Partial<ReadingLocationUpdate>) => {
    try {
      setReadingLocationState((prev) => {
        const partialHasBible = partial.bible !== undefined;

        const drawerSelectionChanged =
          partialHasBible &&
          partial.bible!.book !== undefined &&
          partial.bible!.book !== prev.bible.book;

        const bookChanged =
          partialHasBible &&
          partial.bible!.book !== undefined &&
          partial.bible!.book !== prev.bible.book;

        const chapterChanged =
          partialHasBible &&
          partial.bible!.chapter !== undefined &&
          partial.bible!.chapter !== prev.bible.chapter;

        const pageChanged =
          partialHasBible &&
          partial.bible!.page !== undefined &&
          partial.bible!.page !== prev.bible.page;

        const bookChangedByUserSwipingBack = bookChanged && partial.bible!.page === -1;

        const chapterChangedByUserSwipingBack = chapterChanged && partial.bible!.page === -1;

        let next: ReadingLocation = {
          ...prev,
        };

        if (drawerSelectionChanged) {
          next.drawerSelection = partial.drawerSelection!;
        } else if (bookChanged) {
          next.bible.book = partial.bible!.book!;
          next.bible.chapter = 1;
          next.bible.page = bookChangedByUserSwipingBack ? -1 : 0;
        } else if (chapterChanged) {
          next.bible.chapter = partial.bible!.chapter!;
          next.bible.page = chapterChangedByUserSwipingBack ? -1 : 0;
        } else if (pageChanged) {
          next.bible.page = partial.bible!.page!;
        }

        return next;
      });
    } catch (err) {
      console.error('AppProvider.setReadingLocation()', err);
    }
  };

  const setSessionToken = async (token: string | null) => {
    try {
      setSessionTokenState(token);
      if (token) await SecureStore.setItemAsync(CacheKeys.session_token, token);
      else await SecureStore.deleteItemAsync(CacheKeys.session_token);
    } catch (error) {
      console.error('AppProvider.setSessionToken()', error);
    }
  };

  const setAiMode = async (mode: string) => {
    try {
      setAiModeState(mode);
      await setCache(CacheKeys.ai_mode, mode);
    } catch (error) {
      console.error('AppProvider.setAiMode()', error);
    }
  };

  const setAiThinkingSoundEnabled = async (value: boolean) => {
    try {
      setAiThinkingSoundEnabledState(value);
      await setCache(CacheKeys.ai_thinking_sound_enabled, value);
    } catch (error) {
      console.error('AppProvider.setAiThinkingSoundEnabled()', error);
    }
  };

  const setTheme = async (value: AppTheme) => {
    try {
      setThemeState(value);
      await setCache(CacheKeys.app_theme, value);
    } catch (error) {
      console.error('AppProvider.setTheme()', error);
    }
  };

  // === Compute Navigation theme ===
  const effectiveTheme =
    theme === 'system'
      ? systemColorScheme === 'dark'
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
    aiThinkingSoundEnabled,
    setAiThinkingSoundEnabled,
    theme,
    setTheme,
    isAppReady,
    constructApiUrl,
    constructStorageUrl,
    constructStorageKey,
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
