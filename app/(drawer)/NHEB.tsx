import BibleBookReader from '@/components/bible-book-reader';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useEffect } from 'react';

export default function NHEB() {
  const { readingLocation, setReadingLocation } = useAppPreferences();

  useEffect(() => {
    if (readingLocation.version !== 'NHEB') {
      setReadingLocation({ ...readingLocation, version: 'NHEB' });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setReadingLocation]);

  return <BibleBookReader version="NHEB" />;
}
