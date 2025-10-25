import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useThemeColor } from '@/hooks/use-theme-color';

import { getBibleVersionDisplayName } from '@/utilities/get-bible-version-info';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import AiThinkingIndicator from '@/components/ai-thinking-indicator';

import { Verse } from '@/types/verse';

type SimilarBibleVerseRouteParams = {
  version: string;
  book: string;
  chapter: string;
  verse: string;
  text: string;
};

export default function SimilarBibleVerses() {
  const { version, book, chapter, verse, text } =
    useLocalSearchParams<SimilarBibleVerseRouteParams>();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const { aiMode } = useAppPreferences();

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');

  const fetchSimilarBibleVerses = useCallback(async () => {
    if (!aiMode) return; // wait until mode is loaded
    try {
      const url = `${process.env.EXPO_PUBLIC_AZURE_FUNCTION_URL}${version}/${book}/${chapter}/${verse}/similar/${aiMode}?code=${process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY}`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(
          `API Error ${response.status}: Failed to fetch similar verses for ${version}:${book}:${chapter}:${verse}.`,
        );

      setVerses(await response.json());
      setLoading(false);
    } catch {}
  }, [version, book, chapter, verse, aiMode]);

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
      }>
      <ThemedText type="title" style={styles.title}>
        Similar Verses
      </ThemedText>
      <View style={styles.verseItemContainer}>
        {loading || (verses.length < 0 && <AiThinkingIndicator />)}
        {!loading &&
          verses.map((verse) => (
            <View style={styles.verseItem} key={verse.verseId}>
              <ThemedText type="defaultSemiBold" style={styles.verseId}>
                {verse.verseId}
              </ThemedText>
              <ThemedText style={styles.verseText}>{verse.text}</ThemedText>
            </View>
          ))}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
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
  verseItemContainer: {
    flex: 1,
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
});
