import BibleBookReader from '@/components/bible-book-reader';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useEffect } from 'react';

export default function MAIV() {
  const { readingLocation, setReadingLocation } = useAppPreferences();

  useEffect(() => {
    if (readingLocation.version !== 'MAIV') {
      setReadingLocation({ ...readingLocation, version: 'MAIV' });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setReadingLocation]);

  return <BibleBookReader version="MAIV" />;
}
