import { createContext, useContext, useEffect, useState } from 'react';

import { getCache, setCache } from '@/utilities/cache';

import { AppDefaults } from '@/constants/app-defaults';
import { UserPreferences } from '@/constants/user-preferences';

import { ReadingLocation } from '@/types/reading-locatoin';

type AppPreferencesContextType = {
  version: string;
  setVersion: (version: string) => Promise<void>;
  readingLocation: ReadingLocation;
  setReadingLocation: (readingLocation: ReadingLocation) => Promise<void>;
  aiMode: string;
  setAiMode: (mode: string) => Promise<void>;
  allowAiThinkingSound: boolean;
  setAllowAiThinkingSound: (value: boolean) => Promise<void>;
};

const AppPreferencesContext = createContext<AppPreferencesContextType>({
  version: AppDefaults.version,
  setVersion: async () => {},
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
  const [version, setVersionState] = useState(AppDefaults.version);
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
      const stored = await getCache<string>(UserPreferences.bible_version);
      if (stored) setVersionState(stored);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await getCache<ReadingLocation>(UserPreferences.saved_reading_location);
      if (stored) {
        stored.version = version;
        setReadingLocation(stored);
      }
    })();
  }, [version]);

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

  const setVersion = async (version: string) => {
    setVersionState(version); // updates immediately
    await setCache(UserPreferences.bible_version, version);
  };

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
        version,
        setVersion,
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
