import AsyncStorage from 'expo-sqlite/kv-store';
import { createContext, useContext, useEffect, useState } from 'react';

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
      const stored = await AsyncStorage.getItem(UserPreferences.bible_version);
      if (stored) setVersionState(stored);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(UserPreferences.saved_reading_location);
      if (stored) {
        const savedReadingLocation = JSON.parse(stored) as ReadingLocation;
        savedReadingLocation.version = version;
        setReadingLocation(savedReadingLocation);
      }
    })();
  }, [version]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(UserPreferences.ai_mode);
      if (stored) setAiModeState(stored);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(UserPreferences.ai_thinking_sound);
      if (stored) setAllowAiThinkingSoundState(stored === 'true');
    })();
  }, []);

  const setVersion = async (version: string) => {
    setVersionState(version); // updates immediately
    await AsyncStorage.setItem(UserPreferences.bible_version, version);
  };

  const setReadingLocation = async (readingLocation: ReadingLocation) => {
    setReadingLocationState(readingLocation); // updates immediately
    await AsyncStorage.setItem(
      UserPreferences.saved_reading_location,
      JSON.stringify(readingLocation),
    );
  };

  const setAiMode = async (mode: string) => {
    setAiModeState(mode); // updates immediately
    await AsyncStorage.setItem(UserPreferences.ai_mode, mode);
  };

  const setAllowAiThinkingSound = async (value: boolean) => {
    setAllowAiThinkingSoundState(value); // updates immediately
    await AsyncStorage.setItem(UserPreferences.ai_thinking_sound, value ? 'true' : 'false');
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
