import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import AiThinkingIndicator from '@/components/ai-thinking-indicator';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { useAppContext } from '@/hooks/use-app-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Verse } from '@/types/verse';
import { getBibleVersionDisplayName } from '@/utilities/bible';

type SimilarBibleVerseRouteParams = {
  version: string;
  book: string;
  chapter: string;
  verse: string;
  text: string;
};

export default function SimilarBibleVersesModal() {
  const { version, book, chapter, verse, text } =
    useLocalSearchParams<SimilarBibleVerseRouteParams>();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const { aiMode, constructAPIUrl } = useAppContext();

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');

  const fetchSimilarBibleVerses = useCallback(async () => {
    if (!aiMode) return;
    setLoading(true);

    try {
      const apiUrl = constructAPIUrl(
        `bible/${version}/${book}/${chapter}/${verse}/similar/${aiMode}`,
      );
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.warn('Failed to get similar verses from Azure Function');
        return;
      }
      setVerses(await response.json());
    } catch (err) {
      console.warn('Error fetching similar verses:', err);
    } finally {
      setLoading(false);
    }
  }, [version, book, chapter, verse, aiMode, constructAPIUrl]);

  useEffect(() => {
    fetchSimilarBibleVerses();
  }, [fetchSimilarBibleVerses]);

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
        Similar Verses
      </ThemedText>
      <View style={styles.container}>
        {loading ? (
          <AiThinkingIndicator />
        ) : verses.length > 0 ? (
          verses.map((verse) => (
            <View style={styles.verseItem} key={verse.verseId}>
              <ThemedText type="defaultSemiBold" style={styles.verseId}>
                {verse.verseId.replace(':', ' ')}
              </ThemedText>
              <ThemedText style={styles.verseText}>{verse.text}</ThemedText>
            </View>
          ))
        ) : (
          <View style={[styles.fenceBlock, { backgroundColor: headerBackgroundColor }]}>
            <ThemedText style={styles.fenceText}>
              So sorry! I couldn’t find any similar verses.
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
