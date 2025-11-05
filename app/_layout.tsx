import { UserPreferences } from '@/constants/user-preferences';
import { AppPreferencesProvider, useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { AppThemeProvider } from '@/hooks/use-app-theme-provider';
import { useThemeColor } from '@/hooks/use-theme-color';
import { VerseContextProvider } from '@/hooks/use-verse-context';
import { purgeExpiredCache, setCache } from '@/utilities/cache';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function App() {
  useEffect(() => {
    purgeExpiredCache(); // runs once at launch
  }, []);

  return (
    <ActionSheetProvider>
      <AppPreferencesProvider>
        <AppThemeProvider>
          <VerseContextProvider value={{ verseToPageMap: {}, totalChapterVerseCount: 0 }}>
            <StatusBar style="auto" />
            <RootLayout />
          </VerseContextProvider>
        </AppThemeProvider>
      </AppPreferencesProvider>
    </ActionSheetProvider>
  );
}

function RootLayout() {
  const { readingLocation } = useAppPreferences();
  const backgroundColor = useThemeColor({}, 'background');
  const isInitialMount = useRef(true);

  // Save user's reading location
  useEffect(() => {
    const saveReadingLocation = async () => {
      if (readingLocation && !isInitialMount.current) {
        try {
          await setCache(UserPreferences.saved_reading_location, readingLocation);
        } catch {}
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

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Stack
        screenOptions={{
          headerShown: false,
          // animation: 'none',
          contentStyle: { backgroundColor },
        }}>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(modal)"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
}
