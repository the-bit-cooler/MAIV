import BibleBookReader from '@/components/bible-book-reader';
import { useLocalSearchParams } from 'expo-router';

export default function KJV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="KJV" timestamp={timestamp} />;
}
