import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

import { Colors } from '@/constants';
import { useAppContext } from '@/hooks/useAppContext';

export function useThemeColor(
  props: { light?: string; dark?: string; sepia?: string; error?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark & keyof typeof Colors.sepia,
) {
  const { theme } = useAppContext();
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemColorScheme(colorScheme),
    );
    return () => listener.remove();
  }, []);

  const effectiveTheme = theme === 'system' ? (systemColorScheme ?? 'light') : theme;

  const colorFromProps = props[effectiveTheme as keyof typeof props];
  return colorFromProps ?? Colors[effectiveTheme][colorName];
}
