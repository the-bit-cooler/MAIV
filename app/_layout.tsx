import { AppPreferencesProvider } from '@/hooks/use-app-preferences-provider';
import { AppThemeProvider } from '@/hooks/use-app-theme-provider';
import { purgeExpiredCache } from '@/utilities/cache';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

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
          <Stack
            screenOptions={{
              headerShown: false, // handled inside child layouts
            }}>
            {/* The (drawer) group defines the main app navigation */}
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />

            {/* The (modal) group defines modal routes */}
            <Stack.Screen
              name="(modal)"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack>
        </AppThemeProvider>
      </AppPreferencesProvider>
    </ActionSheetProvider>
  );
}
