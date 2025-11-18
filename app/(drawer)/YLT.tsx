import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components';

export default function YLT() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="YLT" timestamp={timestamp} />;
}
