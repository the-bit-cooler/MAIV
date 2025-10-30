import { CenteredActivityIndicator } from '@/components/centered-activity-indicator';
import { AppDefaults } from '@/constants/app-defaults';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

export default function Index() {
  const isInitialMount = useRef(true);
  const { readingLocation } = useAppPreferences();
  const [ready, setReady] = useState(false);
  const [initialVersion, setInitialVersion] = useState(AppDefaults.version);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (readingLocation.version) {
      setInitialVersion(readingLocation.version);
      setReady(true);
    }
  }, [readingLocation.version]);

  if (!ready) return <CenteredActivityIndicator />;

  return <Redirect href={`/${initialVersion}` as any} />;
}
