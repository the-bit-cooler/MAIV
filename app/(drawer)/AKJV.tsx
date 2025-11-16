import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components/bible-book-reader';

export default function AKJV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="AKJV" timestamp={timestamp} />;
}
