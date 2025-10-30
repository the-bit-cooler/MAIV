import BibleBookReader from '@/components/bible-book-reader';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useEffect } from 'react';

export default function Jubilee2000() {
  const { readingLocation, setReadingLocation } = useAppPreferences();

  useEffect(() => {
    if (readingLocation.version !== 'Jubilee2000') {
      setReadingLocation({ ...readingLocation, version: 'Jubilee2000' });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setReadingLocation]);

  return <BibleBookReader version="Jubilee2000" />;
}
