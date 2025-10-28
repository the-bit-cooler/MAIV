import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useThemeColor } from '@/hooks/use-theme-color';

import { getBibleVersionDisplayName } from '@/utilities/get-bible-version-info';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import AiThinkingIndicator from '@/components/ai-thinking-indicator';

import { Verse } from '@/types/verse';

type BibleVersVersionsRouteParams = {
  version: string;
  book: string;
  chapter: string;
  verse: string;
  text: string;
};

export default function BibleVerseVersions() {
  const { version, book, chapter, verse, text } =
    useLocalSearchParams<BibleVersVersionsRouteParams>();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');

  const fetchBibleVerseVersions = useCallback(async () => {
    setLoading(true);

    try {
      const url = `${process.env.EXPO_PUBLIC_AZURE_FUNCTION_URL}${version}/${book}/${chapter}/${verse}/versions?code=${process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY}`;
      const response = await fetch(url);

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
  }, [version, book, chapter, verse]);

  useEffect(() => {
    fetchBibleVerseVersions();
  }, [fetchBibleVerseVersions]);

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
      }>
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
