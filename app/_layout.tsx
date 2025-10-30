import { UserPreferences } from '@/constants/user-preferences';
import { AppPreferencesProvider, useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { AppThemeProvider } from '@/hooks/use-app-theme-provider';
import { purgeExpiredCache, setCache } from '@/utilities/cache';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

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
          <StatusBar style="auto" />
          <RootLayout />
        </AppThemeProvider>
      </AppPreferencesProvider>
    </ActionSheetProvider>
  );
}

function RootLayout() {
  const { readingLocation } = useAppPreferences();
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
    <Stack
      screenOptions={{
        headerShown: false,
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
  );
}
