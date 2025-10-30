import BibleBookReader from '@/components/bible-book-reader';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useEffect } from 'react';

export default function Webster() {
  const { readingLocation, setReadingLocation } = useAppPreferences();

  useEffect(() => {
    if (readingLocation.version !== 'Webster') {
      setReadingLocation({ ...readingLocation, version: 'Webster' });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setReadingLocation]);

  return <BibleBookReader version="Webster" />;
}
