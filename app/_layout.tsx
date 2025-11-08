import { UserPreferences } from '@/constants/user-preferences';
import { AppPreferencesProvider, useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { AppThemeProvider } from '@/hooks/use-app-theme-provider';
import { useThemeColor } from '@/hooks/use-theme-color';
import { VerseContextProvider } from '@/hooks/use-verse-context';
import { safePurgeExpiredCache, setCache } from '@/utilities/cache';
import { constructAPIUrl } from '@/utilities/construct-api-url';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert, AppState, View } from 'react-native';

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function App() {
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
  const { readingLocation, setSessionToken } = useAppPreferences();
  const backgroundColor = useThemeColor({}, 'background');
  const isInitialMount = useRef(true);

  useEffect(() => {
    safePurgeExpiredCache(); // runs once at launch
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const sessionToken = await SecureStore.getItemAsync(UserPreferences.session_token);

      if (!sessionToken) {
        return;
      }

      try {
        const apiUrl = constructAPIUrl(`validate-login-session`);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
        });

        if (response.ok) {
          setSessionToken(sessionToken);
        } else if (response.status === 401) {
          // Expired or invalid session
          setSessionToken(null);
          await SecureStore.deleteItemAsync(UserPreferences.session_token);
          Alert.alert(
            'Session Expired ⏰',
            'Your secure MAIV session has expired. Please sign in again.',
          );
        }
      } catch {
        // 🔵 Case 5: Network or server unreachable
        Alert.alert(
          'Connection Problem 🚫',
          'Unable to reach our servers. Please check your internet connection and try again.',
        );
      }
    };

    // Delay startup logic slightly to let Expo native modules initialize
    const timer = setTimeout(checkSession, 500);
    return () => clearTimeout(timer);
  }, [setSessionToken]);

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
