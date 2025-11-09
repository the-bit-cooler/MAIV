import { Stack } from 'expo-router';

export default function FallBackModalLayout() {
  return <Stack screenOptions={{ presentation: 'modal' }} />;
}
