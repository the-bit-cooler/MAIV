import { PlatformPressable } from '@react-navigation/elements';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { useLocalSearchParams } from 'expo-router';

import AiThinkingIndicator from '@/components/ai-thinking-indicator';
import { IconSymbol } from '@/components/icon-symbol';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { useAppContext, useThemeColor } from '@/hooks';
import {
  getBibleVersionDisplayName,
  getLargeCache,
  getUserDirective,
  setLargeCache,
  shareMarkdownPdf,
  TTL,
} from '@/utilities';

type BibleVerseExplanationRouteParams = {
  version: string;
  book: string;
  chapter: string;
  verse: string;
  text: string;
};

export default function BibleVerseExplanationModal() {
  const { version, book, chapter, verse, text } =
    useLocalSearchParams<BibleVerseExplanationRouteParams>();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { aiMode, sessionToken, constructAPIUrl } = useAppContext();

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');
  const iconColor = useThemeColor({}, 'tint');
  const markdownBackgroundColor = useThemeColor({}, 'cardBackground');
  const markdownTextColor = useThemeColor({}, 'text');

  const fetchBibleVerseExplanation = useCallback(async () => {
    if (!aiMode) return;
    setLoading(true);

    const cacheKey = `${version}:${book}:${chapter}:${verse}:Explanation:${aiMode}`;

    // Construct known storage URL
    const storageUrl = `${process.env.EXPO_PUBLIC_AZURE_STORAGE_URL}explanation/${version}/${book.replace(/ /g, '')}/${chapter}/${verse}/${aiMode}.txt`;

    try {
      // --- STEP 1: Try local cache ---
      const cached = await getLargeCache<string>(cacheKey);
      if (cached) {
        setExplanation(cached);
        return;
      } else {
        console.log('Explanation cache expired or missing — refetching...');
      }

      // --- STEP 2: Try to fetch from Azure Storage directly ---
      try {
        const fileResponse = await fetch(storageUrl);
        if (fileResponse.ok) {
          const explanationText = await fileResponse.text();
          setExplanation(explanationText);
          await setLargeCache(cacheKey, explanationText, TTL.MONTH);
          return;
        }
      } catch (storageErr) {
        console.warn('Storage fetch failed, will try Azure Function:', storageErr);
      }

      // --- STEP 3: Fallback to Azure Function (generates & stores) ---
      const apiUrl = constructAPIUrl(
        `bible/${version}/${book}/${chapter}/${verse}/explain/${aiMode}`,
      );
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        console.warn('Failed to get explanation URL from Azure Function');
        return;
      }

      const result = await response.text();
      if (!result) {
        console.warn('Azure Function returned empty URL');
        return;
      }

      if (!result.startsWith('https')) {
        const { title, message } = getUserDirective(result);
        Alert.alert(title, message);
        return;
      }

      // Fetch the newly generated file
      const fileResponse = await fetch(result);
      if (!fileResponse.ok) {
        console.warn('Failed to fetch generated explanation file');
        return;
      }

      const explanationText = await fileResponse.text();
      setExplanation(explanationText);
      await setLargeCache(cacheKey, explanationText, TTL.MONTH);
    } catch (err) {
      console.warn('Error fetching explanation:', err);
    } finally {
      setLoading(false);
    }
  }, [aiMode, version, book, chapter, verse, sessionToken, constructAPIUrl]);

  useEffect(() => {
    fetchBibleVerseExplanation();
  }, [fetchBibleVerseExplanation]);

  const sharePdf = async () => {
    if (explanation)
      await shareMarkdownPdf(
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

  const failedMarkdown = `
  \`\`\`
  So sorry! I failed to generate an explanation for this verse. 
  
  I will try again later.
  \`\`\`
  `;

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
      }
    >
      <View style={styles.container}>
        {loading ? (
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
              }}
            >
              {explanation || failedMarkdown}
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
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
