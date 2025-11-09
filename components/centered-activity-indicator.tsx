import { ActivityIndicator, ColorValue, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type CenteredActivityIndicatorProps = {
  size?: 'small' | 'large' | number;
  color?: ColorValue;
  hint?: string;
};

export function CenteredActivityIndicator({ size, color, hint }: CenteredActivityIndicatorProps) {
  const activityColor = useThemeColor({}, 'tint');
  return (
    <View style={styles.activityIndicatorContainer}>
      {hint && (
        <ThemedText type="subtitle" style={{ marginBottom: 20 }}>
          {hint}
        </ThemedText>
      )}
      <ActivityIndicator size={size} color={color ?? activityColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
