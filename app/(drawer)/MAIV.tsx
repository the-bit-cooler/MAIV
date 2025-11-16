import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components/bible-book-reader';

export default function MAIV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="MAIV" timestamp={timestamp} />;
}
