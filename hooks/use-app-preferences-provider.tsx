import { AppDefaults } from '@/constants/app-defaults';
import { UserPreferences } from '@/constants/user-preferences';
import { ReadingLocation } from '@/types/reading-location';
import { getCache, setCache } from '@/utilities/cache';
import { createContext, useContext, useEffect, useState } from 'react';

type AppPreferencesContextType = {
  readingLocation: ReadingLocation;
  setReadingLocation: (readingLocation: ReadingLocation) => Promise<void>;
  aiMode: string;
  setAiMode: (mode: string) => Promise<void>;
  allowAiThinkingSound: boolean;
  setAllowAiThinkingSound: (value: boolean) => Promise<void>;
};

const AppPreferencesContext = createContext<AppPreferencesContextType>({
  readingLocation: {
    version: AppDefaults.version,
    book: AppDefaults.book,
    chapter: 1,
    page: 0,
  },
  setReadingLocation: async () => {},
  aiMode: AppDefaults.aiMode,
  setAiMode: async () => {},
  allowAiThinkingSound: AppDefaults.allowAiThinkingSound,
  setAllowAiThinkingSound: async () => {},
});

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [readingLocation, setReadingLocationState] = useState<ReadingLocation>({
    version: AppDefaults.version,
    book: AppDefaults.book,
    chapter: 1,
    page: 0,
  });
  const [aiMode, setAiModeState] = useState(AppDefaults.aiMode);
  const [allowAiThinkingSound, setAllowAiThinkingSoundState] = useState(
    AppDefaults.allowAiThinkingSound,
  );

  useEffect(() => {
    (async () => {
      const stored = await getCache<ReadingLocation>(UserPreferences.saved_reading_location);
      if (stored) {
        setReadingLocation(stored);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await getCache<string>(UserPreferences.ai_mode);
      if (stored) setAiModeState(stored);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await getCache<boolean>(UserPreferences.ai_thinking_sound);
      setAllowAiThinkingSoundState(stored ?? true);
    })();
  }, []);

  const setReadingLocation = async (readingLocation: ReadingLocation) => {
    setReadingLocationState(readingLocation); // updates immediately
    await setCache(UserPreferences.saved_reading_location, readingLocation);
  };

  const setAiMode = async (mode: string) => {
    setAiModeState(mode); // updates immediately
    await setCache(UserPreferences.ai_mode, mode);
  };

  const setAllowAiThinkingSound = async (value: boolean) => {
    setAllowAiThinkingSoundState(value); // updates immediately
    await setCache(UserPreferences.ai_thinking_sound, value);
  };

  return (
    <AppPreferencesContext.Provider
      value={{
        readingLocation,
        setReadingLocation,
        aiMode,
        setAiMode,
        allowAiThinkingSound,
        setAllowAiThinkingSound,
      }}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  return useContext(AppPreferencesContext);
}
