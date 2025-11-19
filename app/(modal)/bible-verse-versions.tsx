// ============================================================================
// ⚛️ React packages
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// ============================================================================
// 🧩 Expo packages
// ============================================================================

import { useLocalSearchParams } from 'expo-router';

// ============================================================================
// 🏠 Internal assets
// ============================================================================

import { AiThinkingIndicator, ParallaxScrollView, ThemedText } from '@/components';
import { useAppContext, useThemeColor } from '@/hooks';
import { Verse } from '@/types';
import { getBibleVersionDisplayName } from '@/utilities';

// ============================================================================
// ⚙️ Function Component & Props
// ============================================================================

type LocalSearchParams = {
  version: string;
  book: string;
  chapter: string;
  verse: string;
  text: string;
};

export default function BibleVerseVersionsModal() {
  // ============================================================================
  // 🪝 HOOKS (Derived Values)
  // ============================================================================

  const { version, book, chapter, verse, text } = useLocalSearchParams<LocalSearchParams>();
  const { constructAPIUrl } = useAppContext();

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');

  // ============================================================================
  // 🔄 STATE
  // ============================================================================

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // 🧠 MEMOS & CALLBACKS (DERIVED LOGIC)
  // ============================================================================

  const fetchBibleVerseVersions = useCallback(async () => {
    setLoading(true);

    try {
      const apiUrl = constructAPIUrl(`bible/${version}/${book}/${chapter}/${verse}/versions`);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.warn('Failed to get versions to compare from Azure Function');
        return;
      }

      setVerses(await response.json());
    } catch (err) {
      console.warn('Error fetching versions to compare:', err);
    } finally {
      setLoading(false);
    }
  }, [version, book, chapter, verse, constructAPIUrl]);

  // ============================================================================
  // ⚡️ EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchBibleVerseVersions();
  }, [fetchBibleVerseVersions]);

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: headerBackgroundColor,
        dark: headerBackgroundColor,
        sepia: headerBackgroundColor,
      }}
      headerImage={
        <>
          <View style={styles.verseHeaderContainer}>
            <ThemedText type="subtitle" style={styles.verseHeaderText}>
              {text}
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.versionHeaderText}>
              {`${book} ${chapter}:${verse}`}
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.versionHeaderText}>
              {getBibleVersionDisplayName(version)}
            </ThemedText>
          </View>
        </>
      }
    >
      <ThemedText type="title" style={styles.title}>
        Compare Versions
      </ThemedText>
      <View style={styles.container}>
        {loading ? (
          <AiThinkingIndicator />
        ) : verses.length > 0 ? (
          verses.map((verse) => (
            <View style={styles.verseItem} key={verse.version}>
              <ThemedText type="defaultSemiBold" style={styles.verseId}>
                {getBibleVersionDisplayName(verse.version)}:
              </ThemedText>
              <ThemedText style={styles.verseText}>{verse.text}</ThemedText>
            </View>
          ))
        ) : (
          <View style={[styles.fenceBlock, { backgroundColor: headerBackgroundColor }]}>
            <ThemedText style={styles.fenceText}>
              So sorry! I couldn’t find any other versions for comparison.
            </ThemedText>
            <ThemedText style={[styles.fenceText, { marginTop: 20 }]}>
              I will try again later.
            </ThemedText>
          </View>
        )}
      </View>
    </ParallaxScrollView>
  );
}

// ============================================================================
// 🎨 STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  verseHeaderContainer: {
    margin: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  verseHeaderText: {
    marginBottom: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  versionHeaderText: {
    opacity: 0.8,
    textAlign: 'center',
  },
  verseItem: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
  },
  verseId: {
    marginBottom: 5,
  },
  verseText: {
    fontSize: 16,
  },
  title: {
    marginBottom: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  fenceBlock: {
    borderColor: '#666', // neutral mid-gray border
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginVertical: 16,
  },
  fenceText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
  },
});
