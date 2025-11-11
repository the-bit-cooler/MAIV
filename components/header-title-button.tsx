// HeaderTitleButton.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/components/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useAppContext } from '@/hooks/use-app-context';

type Props = {
  onPress: () => void;
};

export function HeaderTitleButton({ onPress }: Props) {
  const { readingLocation } = useAppContext(); // or your context
  const { book, chapter } = readingLocation.bible;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <IconSymbol name="chevron.down" size={16} color="#666" style={{ marginRight: 6 }} />
      <ThemedText type="subtitle">{`${book} ${chapter}`}</ThemedText>
    </TouchableOpacity>
  );
}
