import { PlatformPressable } from '@react-navigation/elements';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from 'expo-sqlite/kv-store';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useThemeColor } from '@/hooks/use-theme-color';

import { getBibleVersionDisplayName } from '@/utilities/get-bible-version-info';
import { shareMarkdownAsPdf } from '@/utilities/share-markdown-as-pdf';

import AiThinkingIndicator from '@/components/ai-thinking-indicator';
import { IconSymbol } from '@/components/icon-symbol';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';

type BibleVerseExplanationRouteParams = {
  version: string;
  book: string;
  chapter: string;
  verse: string;
  text: string;
};

export default function BibleVerseExplanation() {
  const { version, book, chapter, verse, text } =
    useLocalSearchParams<BibleVerseExplanationRouteParams>();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { aiMode } = useAppPreferences();

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');
  const iconColor = useThemeColor({}, 'tint');
  const markdownBackgroundColor = useThemeColor({}, 'cardBackground');
  const markdownTextColor = useThemeColor({}, 'text');

  const fetchBibleVerseExplanation = useCallback(
    async (cacheKey: string) => {
      if (!aiMode) return; // wait until mode is loaded
      try {
        const url = `${process.env.EXPO_PUBLIC_AZURE_FUNCTION_URL}${version}/${book}/${chapter}/${verse}/explain/${aiMode}?code=${process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY}`;
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(
            `API Error ${response.status}: Failed to fetch any insight for ${version}:${book}:${chapter}:${verse}.`,
          );

        const result = await response.text();
        setExplanation(result);
        setLoading(false);
        await AsyncStorage.setItem(cacheKey, result);
      } catch {}
    },
    [version, book, chapter, verse, aiMode],
  );

  useEffect(() => {
    const loadExplanation = async () => {
      const cacheKey = `${version}:${book}:${chapter}:${verse}:Explanation:${aiMode}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setExplanation(cached);
        setLoading(false);
        return;
      }

      fetchBibleVerseExplanation(cacheKey);
    };

    loadExplanation();
  }, [fetchBibleVerseExplanation, version, book, chapter, verse, aiMode]);

  const sharePdf = async () => {
    if (explanation)
      await shareMarkdownAsPdf(
        explanation,
        'Explain Verse',
        `${book} ${chapter}:${verse} (${version})`,
        aiMode,
        {
          version,
          book,
          chapter,
          verse,
          text,
        },
      );
  };

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
          {/* ✅ Floating Share Button */}
          {explanation && (
            <PlatformPressable onPress={sharePdf} style={styles.fab} pressOpacity={0.8}>
              <IconSymbol size={34} name="square.and.arrow.up" color={iconColor} />
            </PlatformPressable>
          )}
        </>
      }>
      <View style={styles.container}>
        {loading || !explanation ? (
          <AiThinkingIndicator />
        ) : (
          <>
            <ThemedText type="title" style={styles.title}>
              Explain Verse
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
              {explanation}
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
