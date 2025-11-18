import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components';

export default function MAIV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="MAIV" timestamp={timestamp} />;
}
