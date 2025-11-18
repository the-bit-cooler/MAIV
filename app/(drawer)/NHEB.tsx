import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components';

export default function NHEB() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="NHEB" timestamp={timestamp} />;
}
