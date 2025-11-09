import { PlatformPressable } from '@react-navigation/elements';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { Image } from 'expo-image';

import AiThinkingIndicator from '@/components/ai-thinking-indicator';
import { IconSymbol } from '@/components/icon-symbol';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { blurhash } from '@/constants/blur-hash';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCache, setCache, TTL } from '@/utilities/cache';
import { shareMarkdownAsPdf } from '@/utilities/share-markdown-as-pdf';

type BibleChapterSummaryParams = {
  book: string;
  chapter: number;
};

export default function BibleChapterSummary({ book, chapter }: BibleChapterSummaryParams) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');
  const iconColor = useThemeColor({}, 'tint');
  const markdownBackgroundColor = useThemeColor({}, 'cardBackground');
  const markdownTextColor = useThemeColor({}, 'text');

  const fetchBibleChapterSummary = useCallback(async () => {
    setLoading(true);

    const cacheKey = `${book}:${chapter}:Summary`;

    // Construct known storage URL
    const storageUrl = `${process.env.EXPO_PUBLIC_AZURE_STORAGE_URL}summary/${book.replace(/ /g, '')}/${chapter}.txt`;

    try {
      // --- STEP 1: Try local cache ---
      const cached = await getCache<string>(cacheKey);
      if (cached) {
        setSummary(cached);
        return;
      } else {
        console.log('Summary cache expired or missing — refetching...');
      }

      // --- STEP 2: Try to fetch from Azure Storage directly ---
      try {
        const fileResponse = await fetch(storageUrl);
        if (fileResponse.ok) {
          const summaryText = await fileResponse.text();
          setSummary(summaryText);
          await setCache(cacheKey, summaryText, TTL.MONTH);
        }
      } catch (storageErr) {
        console.warn('Storage fetch failed:', storageErr);
      }
    } catch (err) {
      console.warn('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
  }, [book, chapter]);

  useEffect(() => {
    fetchBibleChapterSummary();
  }, [fetchBibleChapterSummary]);

  const imageUrl = `${process.env.EXPO_PUBLIC_AZURE_STORAGE_URL}summary/${book.replace(/ /g, '')}/${chapter}.png`;

  const sharePdf = async () => {
    if (summary)
      await shareMarkdownAsPdf(
        summary,
        `Summary of ${book} ${chapter}`,
        `${book} ${chapter}`,
        undefined, // no ai mode
        undefined, // no verse obj
        imageUrl,
      );
  };

  const failedMarkdown = `
  \`\`\`
  So sorry! I failed to generate a summary for this chapter. 
  
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
        {loading ? (
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
              {summary || failedMarkdown}
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
