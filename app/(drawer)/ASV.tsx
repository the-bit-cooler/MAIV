import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components';

export default function ASV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="ASV" timestamp={timestamp} />;
}
