import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components';

export default function Webster() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="Webster" timestamp={timestamp} />;
}
