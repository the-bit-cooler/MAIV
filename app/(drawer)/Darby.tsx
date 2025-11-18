import { useLocalSearchParams } from 'expo-router';

import { BibleBookReader } from '@/components';

export default function Darby() {
  const { timestamp } = useLocalSearchParams<{ timestamp: string }>();

  return <BibleBookReader version="Darby" timestamp={timestamp} />;
}
