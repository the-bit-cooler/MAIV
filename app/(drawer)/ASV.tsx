import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components/bible-book-reader';

export default function ASV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="ASV" timestamp={timestamp} />;
}
