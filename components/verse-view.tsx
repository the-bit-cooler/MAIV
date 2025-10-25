import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { Verse } from '@/types/verse';

type VerseViewProps = {
  verse: Verse;
  verseNumberColor: string;
};

export const VerseView = ({ verse, verseNumberColor }: VerseViewProps) => (
  <View style={{ marginVertical: 7, paddingHorizontal: 16 }}>
    <ThemedText type="subtitle">
      <ThemedText type="defaultSemiBold" style={{ fontWeight: 'bold', color: verseNumberColor }}>
        {'     '}
        {verse.verse}
        {'   '}
      </ThemedText>
      {verse.text}
    </ThemedText>
  </View>
);
