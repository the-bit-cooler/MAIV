import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components';

export default function KJV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="KJV" timestamp={timestamp} />;
}
