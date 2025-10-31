import BibleBookReader from '@/components/bible-book-reader';
import { useLocalSearchParams } from 'expo-router';

export default function ASV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="ASV" timestamp={timestamp} />;
}
