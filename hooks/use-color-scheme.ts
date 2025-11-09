import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

import { ThemeName } from '@/constants/theme';
import { UserPreferences } from '@/constants/user-preferences';
import { AppTheme } from '@/hooks/use-app-context';
import { getCache } from '@/utilities/cache';

export function useColorScheme(): ThemeName {
  const [theme, setTheme] = useState<ThemeName>('light');

  useEffect(() => {
    (async () => {
      const stored = await getCache<AppTheme>(UserPreferences.app_theme);
      if (!stored || stored === 'system') {
        const sys = (Appearance.getColorScheme() ?? 'light') as ThemeName;
        setTheme(sys);
      } else {
        setTheme(stored);
      }
    })();
  }, []);

  return theme;
}
