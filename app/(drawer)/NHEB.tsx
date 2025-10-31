import BibleBookReader from '@/components/bible-book-reader';
import { useLocalSearchParams } from 'expo-router';

export default function NHEB() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="NHEB" timestamp={timestamp} />;
}
