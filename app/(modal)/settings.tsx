import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Application from 'expo-application';

import { HorizontalThemedSeparator } from '@/components/themed-separator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AiModeValues, AppDefaults, Colors } from '@/constants';
import { AppTheme, useAppContext, useThemeColor } from '@/hooks';
import { clearCache, clearLargeCache } from '@/utilities/cache';

export default function SettingsModal() {
  const { theme, setTheme } = useAppContext();
  const backgroundColor = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

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
              setTheme(AppDefaults.theme); // reset theme to system default
            } catch (err) {
              Alert.alert('Error', 'Something went wrong! Pleas try again later.');
              console.error('Error clearing app data: ', err);
            }
          },
        },
      ],
    );
  };

  const showAbout = () => {
    Alert.alert(
      `${Application.applicationName}: Modern AI Version`,
      `App Version ${Application.nativeApplicationVersion}\nBuild Number ${Application.nativeBuildVersion}\n© 2025 ScripturAI\n\nIn ❤️❤️ memory of Charlie Kirk`,
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <AppearanceSection
          appTheme={theme}
          headerColor={textColor}
          optionColor={textColor}
          selectedColor={tintColor}
          setAppTheme={setTheme}
        />
        <HorizontalThemedSeparator />
        <AiModeSection headerColor={textColor} optionColor={textColor} selectedColor={tintColor} />
        <HorizontalThemedSeparator />
        <View style={{ marginTop: 10, alignSelf: 'center', width: 200 }}>
          <Button title="Clear App Data" color={Colors.error.text} onPress={clearStorage} />
        </View>
        <View style={{ marginTop: 20, marginBottom: 30, alignSelf: 'center', width: 200 }}>
          <Button title="About" onPress={showAbout} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type AppearanceSectionProps = {
  appTheme: AppTheme;
  headerColor: string;
  optionColor: string;
  selectedColor: string;
  setAppTheme: (theme: AppTheme) => void;
};

const AppearanceSection = ({
  appTheme,
  headerColor,
  optionColor,
  selectedColor,
  setAppTheme,
}: AppearanceSectionProps) => {
  const themeOptions = ['light', 'dark', 'sepia', 'system'] as const;
  const themeOptionLabels = ['Light Mode', 'Dark Mode', 'Reading Mode', 'System Default'] as const;

  return (
    <>
      <ThemedText type="subtitle" style={[styles.header, { color: headerColor }]}>
        Appearance
      </ThemedText>
      {themeOptions.map((option, index) => {
        const isSelected = appTheme === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              { borderColor: isSelected ? selectedColor : 'transparent' },
            ]}
            onPress={() => setAppTheme(option)}
          >
            <ThemedText style={{ color: isSelected ? selectedColor : optionColor }}>
              {themeOptionLabels[index]}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </>
  );
};

type AiModeSectionProps = {
  headerColor: string;
  optionColor: string;
  selectedColor: string;
};

const AiModeSection = ({ headerColor, optionColor, selectedColor }: AiModeSectionProps) => {
  const { aiMode, setAiMode, aiThinkingSoundEnabled, setAiThinkingSoundEnabled } = useAppContext();

  return (
    <View style={{ marginTop: 10 }}>
      <ThemedText type="subtitle" style={[styles.header, { color: headerColor }]}>
        AI Mode
      </ThemedText>
      {AiModeValues.map((option) => {
        const isSelected = aiMode === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              { borderColor: isSelected ? selectedColor : 'transparent' },
            ]}
            onPress={() => setAiMode(option)}
          >
            <ThemedText style={{ color: isSelected ? selectedColor : optionColor }}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
      <View style={styles.soundToggleContainer}>
        <ThemedText style={styles.soundToggleLabel}>Enable Thinking Sound</ThemedText>
        <Switch
          value={aiThinkingSoundEnabled}
          onValueChange={(value) => setAiThinkingSoundEnabled(value)}
        />
      </View>
    </View>
  );
};

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
