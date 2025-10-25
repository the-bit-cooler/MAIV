import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import Markdown from 'react-native-markdown-display';
import { Image } from 'expo-image';

import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useThemeColor } from '@/hooks/use-theme-color';

import { shareMarkdownAsPdf } from '@/utilities/share-markdown-as-pdf';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import AiThinkingIndicator from '@/components/ai-thinking-indicator';
import { IconSymbol } from '@/components/icon-symbol';
import { ThemedText } from '@/components/themed-text';

type BibleChapterSummaryParams = {
  version: string;
  book: string;
  chapter: number;
};

export default function BibleChapterSummary({ version, book, chapter }: BibleChapterSummaryParams) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { aiMode } = useAppPreferences();

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');
  const iconColor = useThemeColor({}, 'tint');
  const markdownBackgroundColor = useThemeColor({}, 'cardBackground');
  const markdownTextColor = useThemeColor({}, 'text');

  const fetchBibleChapterSummary = useCallback(
    async (cacheKey: string) => {
      if (!aiMode) return; // wait until mode is loaded
      try {
        const url = `${process.env.EXPO_PUBLIC_AZURE_FUNCTION_URL}${version}/${book}/${chapter}/summarize/${aiMode}?code=${process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY}`;
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(
            `API Error ${response.status}: Failed to fetch a summary for ${version}:${book}:${chapter}.`,
          );

        const result = await response.text();
        setSummary(result);
        setLoading(false);
        await AsyncStorage.setItem(cacheKey, result);
      } catch (err) {
        console.warn(err);
      }
    },
    [version, book, chapter, aiMode],
  );

  useEffect(() => {
    const loadSummary = async () => {
      const cacheKey = `${version}:${book}:${chapter}:Summary:${aiMode}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setSummary(cached);
        setLoading(false);
        return;
      }

      await fetchBibleChapterSummary(cacheKey);
    };

    loadSummary();
  }, [fetchBibleChapterSummary, version, book, chapter, aiMode]);

  const imageUrl = `${process.env.EXPO_PUBLIC_AZURE_STORAGE_URL}${book}/${chapter}.png`;

  const sharePdf = async () => {
    if (summary)
      await shareMarkdownAsPdf(
        summary,
        `Summary of ${book} ${chapter} (${version})`,
        `${book} ${chapter} (${version})`,
        aiMode,
        undefined,
        imageUrl,
      );
  };

  const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: headerBackgroundColor,
        dark: headerBackgroundColor,
        sepia: headerBackgroundColor,
      }}
      headerImage={
        <>
          <View style={styles.headerImageContainer}>
            <Image
              style={styles.headerImage}
              source={{ uri: imageUrl }}
              placeholder={{ blurhash }}
              placeholderContentFit="fill"
              contentFit="fill"
              transition={1000}
            />
          </View>
          {/* ✅ Floating Share Button */}
          {summary && (
            <PlatformPressable onPress={sharePdf} style={styles.fab} pressOpacity={0.8}>
              <IconSymbol size={34} name="square.and.arrow.up" color={iconColor} />
            </PlatformPressable>
          )}
        </>
      }>
      <View style={[styles.container]}>
        {loading || !summary ? (
          <AiThinkingIndicator />
        ) : (
          <>
            <ThemedText type="title" style={styles.title}>
              Chapter Summary
            </ThemedText>
            <Markdown
              style={{
                body: { color: markdownTextColor, fontSize: 18 },
                heading1: { color: markdownTextColor, fontSize: 28 },
                heading2: { color: markdownTextColor, fontSize: 22 },
                heading3: { color: markdownTextColor },
                blockquote: {
                  backgroundColor: markdownBackgroundColor,
                  color: markdownTextColor,
                  borderLeftWidth: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                },
                code_block: {
                  backgroundColor: markdownBackgroundColor,
                  color: markdownTextColor,
                  borderRadius: 4,
                  paddingHorizontal: 4,
                },
                code_inline: {
                  backgroundColor: markdownBackgroundColor,
                  color: markdownTextColor,
                  borderRadius: 4,
                  paddingHorizontal: 4,
                },
                fence: {
                  backgroundColor: markdownBackgroundColor,
                  color: markdownTextColor,
                  padding: 8,
                  borderRadius: 8,
                },
              }}>
              {summary}
            </Markdown>
          </>
        )}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImageContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0553',
  },
  title: {
    marginBottom: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 5,
  },
});
