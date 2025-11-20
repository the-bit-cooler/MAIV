import { AiModes } from '@/constants/ai-constants';
import { ThemeName } from '@/constants/theme';

export const AppDefaults = {
  drawerSelection: 'MAIV',
  bibleBook: 'Genesis',
  aiMode: AiModes.devotional,
  aiThinkingSoundEnabled: true,
  theme: 'sepia' as ThemeName,
};
