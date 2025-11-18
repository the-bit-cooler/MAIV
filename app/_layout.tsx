import { useEffect } from 'react';
import { View } from 'react-native';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppProvider, useThemeColor } from '@/hooks';
import { purgeExpiredCache, purgeExpiredLargeCache } from '@/utilities/cache';

// Instruct SplashScreen not to hide yet, we want to do this manually
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function App() {
  useEffect(() => {
    async function cleanUpCache() {
      try {
        await purgeExpiredCache();
        await purgeExpiredLargeCache();
      } catch (err) {
        console.warn('Cache purge failed:', err);
      }
    }

    cleanUpCache();
  }, []);

  return (
    <AppProvider>
      <StatusBar style="auto" />
      <RootLayout />
    </AppProvider>
  );
}

function RootLayout() {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
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
