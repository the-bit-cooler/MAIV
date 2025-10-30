import BibleBookReader from '@/components/bible-book-reader';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useEffect } from 'react';

export default function ASV() {
  const { readingLocation, setReadingLocation } = useAppPreferences();

  useEffect(() => {
    if (readingLocation.version !== 'ASV') {
      setReadingLocation({ ...readingLocation, version: 'ASV' });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setReadingLocation]);

  return <BibleBookReader version="ASV" />;
}
