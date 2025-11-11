import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
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
  );
}
