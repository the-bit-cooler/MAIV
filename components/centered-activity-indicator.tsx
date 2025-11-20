// ============================================================================
// ⚛️ React packages
// ============================================================================

import { ActivityIndicator, ColorValue, StyleSheet, View } from 'react-native';

// ============================================================================
// 🏠 Internal assets
// ============================================================================

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks';

// ============================================================================
// ⚙️ Function Component & Props
// ============================================================================

type Props = {
  size?: 'small' | 'large' | number;
  color?: ColorValue;
  hint?: string;
};

export function CenteredActivityIndicator({ size, color, hint }: Props) {
  // ============================================================================
  // 🪝 HOOKS (Derived Values)
  // ============================================================================

  const activityColor = useThemeColor({}, 'tint');

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

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

// ============================================================================
// 🎨 STYLES
// ============================================================================

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
