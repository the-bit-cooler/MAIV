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
  //* Set initial context to nonsense (see below for sense)
  readingLocation: {
    version: 'N/A',
    book: 'N/A',
    chapter: 0,
    page: -100,
  },
  setReadingLocation: async () => {},
  aiMode: AppDefaults.aiMode,
  setAiMode: async () => {},
  allowAiThinkingSound: AppDefaults.allowAiThinkingSound,
  setAllowAiThinkingSound: async () => {},
});

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  //* Set initial state to nonsense (see below for sense)
  const [readingLocation, setReadingLocationState] = useState<ReadingLocation>({
    version: 'N/A',
    book: 'N/A',
    chapter: 0,
    page: -100,
  });
  const [aiMode, setAiModeState] = useState(AppDefaults.aiMode);
  const [allowAiThinkingSound, setAllowAiThinkingSoundState] = useState(
    AppDefaults.allowAiThinkingSound,
  );

  useEffect(() => {
    (async () => {
      /*
       * Our app index relies on ReadingLocation to change after initial mount,
       * so we check for a saved one or set the app default one here.
       * This is why we use a nonsense initial ReadingLocation above.
       * All values must change in case any is used as a hook dependency.
       */
      const firstTime: ReadingLocation = {
        version: AppDefaults.version,
        book: AppDefaults.book,
        chapter: 1,
        page: 0,
      };
      const stored = await getCache<ReadingLocation>(UserPreferences.saved_reading_location);
      setReadingLocationState(stored ?? firstTime);
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
