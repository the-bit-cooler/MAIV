import BibleBookReader from '@/components/bible-book-reader';
import { useLocalSearchParams } from 'expo-router';

export default function MAIV() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="MAIV" timestamp={timestamp} />;
}
