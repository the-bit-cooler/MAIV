import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components';

export default function Jubilee2000() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="Jubilee2000" timestamp={timestamp} />;
}
