import { Redirect, useLocalSearchParams } from 'expo-router';

export default function Index() {
  const { drawerSelection } = useLocalSearchParams<{ drawerSelection: string }>();

  return <Redirect href={`/${drawerSelection}` as any} />;
}
