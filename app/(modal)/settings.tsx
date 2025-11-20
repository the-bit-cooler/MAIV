// ============================================================================
// ⚛️ React packages
// ============================================================================

import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';

// ============================================================================
// 🏠 Internal assets
// ============================================================================

import { HorizontalThemedSeparator, ThemedText, ThemedView } from '@/components';
import { AiModeValues, AppDefaults, Colors } from '@/constants';
import { useAppContext, useThemeColor } from '@/hooks';
import { clearCache, clearLargeCache } from '@/utilities';

// ============================================================================
// ⚙️ Function Component & Props
// ============================================================================

export default function SettingsModal() {
  // ============================================================================
  // 🪝 HOOKS (Derived Values)
  // ============================================================================

  const { theme, setTheme, aiMode, setAiMode, aiThinkingSoundEnabled, setAiThinkingSoundEnabled } =
    useAppContext();

  const backgroundColor = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // ============================================================================
  // 📐 CONSTANTS
  // ============================================================================

  const themeOptions = ['light', 'dark', 'sepia', 'system'] as const;
  const themeOptionLabels = ['Light Mode', 'Dark Mode', 'Reading Mode', 'System Default'] as const;

  // ============================================================================
  // 🎛 HANDLERS
  // ============================================================================

  const clearStorage = async () => {
    Alert.alert(
      'Clear App Data',
      'Are you sure you want to clear all app data? \n\n This will remove all downloaded bible books and other related content. \n\nThis will also reset your theme and other preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              await clearLargeCache();
              Alert.alert('Cleared', 'All app data has been cleared.');
              await setTheme(AppDefaults.theme); // reset theme to system default
            } catch (err) {
              Alert.alert('Error', 'Something went wrong! Pleas try again later.');
              console.error('Error clearing app data: ', err);
            }
          },
        },
      ],
    );
  };

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <ThemedText type="subtitle" style={[styles.header, { color: textColor }]}>
            Appearance
          </ThemedText>
          {themeOptions.map((option, index) => {
            const isSelected = theme === option;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  { borderColor: isSelected ? tintColor : 'transparent' },
                ]}
                onPress={() => setTheme(option)}
              >
                <ThemedText style={{ color: isSelected ? tintColor : textColor }}>
                  {themeOptionLabels[index]}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
        <HorizontalThemedSeparator />
        <View style={{ marginTop: 10 }}>
          <ThemedText type="subtitle" style={[styles.header, { color: textColor }]}>
            AI Mode
          </ThemedText>
          {AiModeValues.map((option) => {
            const isSelected = aiMode === option;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  { borderColor: isSelected ? tintColor : 'transparent' },
                ]}
                onPress={async () => await setAiMode(option)}
              >
                <ThemedText style={{ color: isSelected ? tintColor : textColor }}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
          <View style={styles.soundToggleContainer}>
            <ThemedText style={styles.soundToggleLabel}>Enable Thinking Sound</ThemedText>
            <Switch
              value={aiThinkingSoundEnabled}
              onValueChange={async (value) => await setAiThinkingSoundEnabled(value)}
            />
          </View>
        </View>
        <HorizontalThemedSeparator />
        <View style={{ marginTop: 10, alignSelf: 'center', width: 200 }}>
          <Button title="Clear App Data" color={Colors.error.text} onPress={clearStorage} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// ============================================================================
// 🎨 STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 8,
    marginVertical: 6,
  },
  soundToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  soundToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
