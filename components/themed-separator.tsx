import { View } from 'react-native';

import { useThemeColor } from '@/hooks';

export function HorizontalThemedSeparator({ marginVertical }: { marginVertical?: number }) {
  const borderColor = useThemeColor({}, 'border');
  return (
    <View
      style={[
        {
          height: 1.5,
          backgroundColor: borderColor + '80', // 50% opacity
          marginVertical: marginVertical ?? 10,
          borderRadius: 1,
        },
      ]}
    />
  );
}
