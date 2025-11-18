import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Appearance, AppState } from 'react-native';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';

import { AppDefaults } from '@/constants/app-defaults';
import { DarkNavTheme, LightNavTheme, SepiaNavTheme } from '@/constants/navigation-theme';
import { ThemeName } from '@/constants/theme';
import { UserPreferences } from '@/constants/user-preferences';
import type { ReadingLocation } from '@/types';
import { getCache, setCache } from '@/utilities/cache';

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

  constructAPIUrl: (path: string) => string;
  constructStorageUrl: ({ type, version, book, chapter, verse, aiMode, ext }: StorageUrl) => string;
  constructStorageKey: ({ version, book, chapter, verse, suffix }: StorageKey) => string;
};

type StorageUrl = {
  type: 'summary' | 'explanation' | 'illustration' | 'translation';
  version?: string;
  book: string;
  chapter: number;
  verse?: number;
  aiMode?: string;
  ext: 'txt' | 'png';
};

type StorageKey = {
  version?: string;
  book?: string;
  chapter?: number;
  verse?: number;
  suffix: 'pages' | 'summary' | 'explanation' | 'translation';
};

type ReadingLocationUpdate = {
  bible?: Partial<ReadingLocation['bible']>;
} & Partial<Omit<ReadingLocation, 'bible'>>;

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
  const [aiThinkingSoundEnabled, setAiThinkingSoundEnabledState] = useState(
    AppDefaults.aiThinkingSoundEnabled,
  );
  const [theme, setThemeState] = useState<AppTheme>(AppDefaults.theme);
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());
  const [isAppReady, setIsAppReady] = useState(false);
  const isInitialMount = useRef(true);

  // === Construct API URL (memoized) ===
  const constructAPIUrl = useCallback(
    (path: string) => {
      return `${process.env.EXPO_PUBLIC_AZURE_FUNCTION_URL}${path}?code=${process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY}`;
    },
    [], // static, no dependencies
  );

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

  // === Construct Storage Key (memoized) ===
  const constructStorageKey = useCallback(
    ({ version, book, chapter, verse, suffix }: StorageKey) => {
      const parts: (string | number | undefined)[] = [version, book, chapter, verse, suffix];

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
          getCache<ReadingLocation>(UserPreferences.reading_location),
          getCache<string>(UserPreferences.ai_mode),
          getCache<boolean>(UserPreferences.ai_thinking_sound_enabled),
          getCache<AppTheme>(UserPreferences.app_theme),
          SecureStore.getItemAsync(UserPreferences.session_token),
        ]);

        if (storedLoc) setReadingLocationState(storedLoc);
        if (storedAiMode) setAiModeState(storedAiMode);
        if (storedSound) setAiThinkingSoundEnabledState(storedSound);
        if (storedTheme) setThemeState(storedTheme);

        // 🔹 Validate session token if it exists
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
  }, [constructAPIUrl]);

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

  // === Save user's reading location ===
  useEffect(() => {
    const saveReadingLocation = async () => {
      if (readingLocation && !isInitialMount.current) {
        try {
          await setCache(UserPreferences.reading_location, readingLocation);
        } catch (error) {
          console.error('AppProvider.useEffect() => saveReadingLocation()', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') saveReadingLocation(); // Save when app is placed in background
    });

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    return () => {
      subscription.remove();
      saveReadingLocation(); // Save on unmount
    };
  }, [readingLocation]);

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
      if (token) await SecureStore.setItemAsync(UserPreferences.session_token, token);
      else await SecureStore.deleteItemAsync(UserPreferences.session_token);
    } catch (error) {
      console.error('AppProvider.setSessionToken()', error);
    }
  };

  const setAiMode = async (mode: string) => {
    try {
      setAiModeState(mode);
      await setCache(UserPreferences.ai_mode, mode);
    } catch (error) {
      console.error('AppProvider.setAiMode()', error);
    }
  };

  const setAiThinkingSoundEnabled = async (value: boolean) => {
    try {
      setAiThinkingSoundEnabledState(value);
      await setCache(UserPreferences.ai_thinking_sound_enabled, value);
    } catch (error) {
      console.error('AppProvider.setAiThinkingSoundEnabled()', error);
    }
  };

  const setTheme = async (value: AppTheme) => {
    try {
      setThemeState(value);
      await setCache(UserPreferences.app_theme, value);
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
    constructAPIUrl,
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
