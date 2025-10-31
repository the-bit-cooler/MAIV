import BibleBookReader from '@/components/bible-book-reader';
import { useLocalSearchParams } from 'expo-router';

export default function AKJV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="AKJV" timestamp={timestamp} />;
}
