import { AiModes } from '@/constants/ai-modes';

import { ThemeName } from './theme';

export const AppDefaults = {
  drawerSelection: 'MAIV',
  bibleBook: 'Genesis',
  aiMode: AiModes.devotional,
  aiThinkingSoundEnabled: true,
  theme: 'sepia' as ThemeName,
};
