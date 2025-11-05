import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ModalLayout() {
  const isIOS = Platform.OS === 'ios';

  // Android uses a slide in modal that looks like a page navigation instead of a dismissible popup like iOS.
  // So we show header on Android because it offers the user a back button in top right corner.
  return isIOS ? (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="bible-verse-illustration"
        options={{
          title: 'Verse Illustration',
          headerShown: true,
        }}
      />
    </Stack>
  ) : (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="bible-verse-explanation"
        options={{
          title: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="bible-verse-illustration"
        options={{
          title: 'Verse Illustration',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="bible-verse-versions"
        options={{
          title: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="new-bible-verse-translation"
        options={{
          title: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="similar-bible-verses"
        options={{
          title: '',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
