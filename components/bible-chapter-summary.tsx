// ============================================================================
// ⚛️ React packages
// ============================================================================

import { PlatformPressable } from '@react-navigation/elements';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

// ============================================================================
// 🧩 Expo packages
// ============================================================================

import { Image } from 'expo-image';

// ============================================================================
// 🏠 Internal assets
// ============================================================================

import { AiThinkingIndicator } from '@/components/ai-thinking-indicator';
import { IconSymbol } from '@/components/icon-symbol';
import { ParallaxScrollView } from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { blurhash, TTL } from '@/constants';
import { useAppContext, useThemeColor } from '@/hooks';
import { getLargeCache, setLargeCache, shareMarkdownPdf } from '@/utilities';

// ============================================================================
// ⚙️ Function Component & Props
// ============================================================================

type BibleChapterSummaryProps = {
  book: string;
  chapter: number;
};

export function BibleChapterSummary({ book, chapter }: BibleChapterSummaryProps) {
  // ============================================================================
  // 🪝 HOOKS (Derived Values)
  // ============================================================================

  const { constructStorageKey, constructStorageUrl } = useAppContext();

  const headerBackgroundColor = useThemeColor({}, 'cardBackground');
  const iconColor = useThemeColor({}, 'tint');
  const markdownBackgroundColor = useThemeColor({}, 'cardBackground');
  const markdownTextColor = useThemeColor({}, 'text');

  // ============================================================================
  // 🔄 STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);

  // ============================================================================
  // 📐 CONSTANTS
  // ============================================================================

  const fallbackMarkdown = `
  \`\`\`
  So sorry! I failed to generate a summary for this chapter. 
  
  I will try again later.
  \`\`\`
  `;

  // ============================================================================
  // 🧠 MEMOS & CALLBACKS (DERIVED LOGIC)
  // ============================================================================

  const imageUrl = constructStorageUrl({ type: 'summary', book, chapter, ext: 'png' });

  const sharePdf = useCallback(async () => {
    try {
      if (summary) {
        await shareMarkdownPdf(
          summary,
          `Summary of ${book} ${chapter}`,
          `${book} ${chapter}`,
          undefined, // no ai mode
          undefined, // no verse obj
          imageUrl,
        );
      }
    } catch (error) {
      console.error('BibleChapterSummary.sharePdf()', error);
    }
  }, [summary, book, chapter, imageUrl]);

  // ============================================================================
  // ⚡️ EFFECTS
  // ============================================================================

  useEffect(() => {
    setLoading(true);

    async function loadBibleChapterSummary() {
      if (!book || !chapter) return;

      // --- STEP 1: Try local cache ---
      const storageKey = constructStorageKey({ type: 'summary', book, chapter });

      try {
        const cached = await getLargeCache<string>(storageKey);
        if (cached) {
          setSummary(cached);
          setLoading(false);
          return;
        } else {
          console.warn(
            'BibleChapterSummary.useEffect() => loadBibleChapterSummary() => getLargeCache()',
            storageKey,
            'expired or missing',
          );
        }
      } catch (error) {
        console.error(
          'BibleChapterSummary.useEffect() => loadBibleChapterSummary() => getLargeCache()',
          storageKey,
          error,
        );
      }

      // --- STEP 2: Try to fetch from Azure Storage directly ---
      const storageUrl = constructStorageUrl({ type: 'summary', book, chapter, ext: 'txt' });

      try {
        const res = await fetch(storageUrl);
        if (res.ok) {
          const summaryText = await res.text();
          setSummary(summaryText);
          await setLargeCache(storageKey, summaryText, TTL.MONTH);
        } else {
          console.warn(
            'BibleChapterSummary.useEffect() => loadBibleChapterSummary() => fetch()',
            storageUrl,
            `HTTP STATUS ${res.status}: ${res.statusText || 'unknown'}`,
          );
        }
      } catch (error) {
        console.error(
          'BibleChapterSummary.useEffect() => loadBibleChapterSummary() => fetch()',
          storageUrl,
          error,
        );
      }

      setLoading(false);
    }

    loadBibleChapterSummary();
  }, [book, chapter, constructStorageKey, constructStorageUrl]);

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

  return (
    <ParallaxScrollView
      key={`summary-${book}-${chapter}`}
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
      }
    >
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
              }}
            >
              {summary || fallbackMarkdown}
            </Markdown>
          </>
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
