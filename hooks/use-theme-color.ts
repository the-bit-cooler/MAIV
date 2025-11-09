import { Appearance } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAppContext } from '@/hooks/use-app-context';

export function useThemeColor(
  props: { light?: string; dark?: string; sepia?: string; error?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark & keyof typeof Colors.sepia,
) {
  const { theme } = useAppContext();

  // map "system" to actual theme
  const effectiveTheme =
    theme === 'system' ? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') : theme;

  const colorFromProps = props[effectiveTheme];
  if (colorFromProps) return colorFromProps;

  return Colors[effectiveTheme][colorName];
}
