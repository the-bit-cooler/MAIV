import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  Theme,
} from '@react-navigation/native';

import { Colors } from '@/constants';

export const LightNavTheme: Theme = {
  ...NavDefaultTheme, // ✅ brings in fonts + other defaults
  colors: {
    ...NavDefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.cardBackground,
    text: Colors.light.text,
    border: '#E5E5E5',
    notification: Colors.light.tint,
  },
};

export const DarkNavTheme: Theme = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.cardBackground,
    text: Colors.dark.text,
    border: '#27272A',
    notification: Colors.dark.tint,
  },
};

export const SepiaNavTheme: Theme = {
  ...NavDefaultTheme,
  colors: {
    ...NavDefaultTheme.colors,
    primary: Colors.sepia.tint,
    background: Colors.sepia.background,
    card: Colors.sepia.cardBackground,
    text: Colors.sepia.text,
    border: '#D9C7A3',
    notification: Colors.sepia.tint,
  },
};
