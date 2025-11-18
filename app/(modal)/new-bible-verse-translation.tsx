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

type NewBibleVerseTranslationRouteParams = {
  version: string;
  book: string;
  chapter: string;
  verse: string;
  text: string;
};

export default function NewBibleVerseTranslationModal() {
  const { version, book, chapter, verse, text } =
    useLocalSearchParams<NewBibleVerseTranslationRouteParams>();
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { aiMode, sessionToken, constructAPIUrl } = useAppContext();

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');
  const iconColor = useThemeColor({}, 'tint');
  const markdownBackgroundColor = useThemeColor({}, 'cardBackground');
  const markdownTextColor = useThemeColor({}, 'text');

  const fetchNewBibleVerseTranslation = useCallback(async () => {
    if (!aiMode) return;
    setLoading(true);

    const cacheKey = `${version}:${book}:${chapter}:${verse}:Translation:${aiMode}`;

    // Construct known storage URL
    const storageUrl = `${process.env.EXPO_PUBLIC_AZURE_STORAGE_URL}translation/${version}/${book.replace(/ /g, '')}/${chapter}/${verse}/${aiMode}.txt`;

    try {
      // --- STEP 1: Try local cache ---
      const cached = await getLargeCache<string>(cacheKey);
      if (cached) {
        setTranslation(cached);
        return;
      } else {
        console.log('New translation cache expired or missing — refetching...');
      }

      // --- STEP 2: Try to fetch from Azure Storage directly ---
      try {
        const fileResponse = await fetch(storageUrl);
        if (fileResponse.ok) {
          const translationText = await fileResponse.text();
          setTranslation(translationText);
          await setLargeCache(cacheKey, translationText, TTL.MONTH);
          return;
        }
      } catch (storageErr) {
        console.warn('Storage fetch failed, will try Azure Function:', storageErr);
      }

      // --- STEP 3: Fallback to Azure Function (generates & stores) ---
      const apiUrl = constructAPIUrl(
        `bible/${version}/${book}/${chapter}/${verse}/translate/${aiMode}`,
      );
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        console.warn('Failed to get translation URL from Azure Function');
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
        console.warn('Failed to fetch generated translation file');
        return;
      }

      const translationText = await fileResponse.text();
      setTranslation(translationText);
      await setLargeCache(cacheKey, translationText, TTL.MONTH);
    } catch (err) {
      console.warn('Error fetching translation:', err);
    } finally {
      setLoading(false);
    }
  }, [version, book, chapter, verse, aiMode, sessionToken, constructAPIUrl]);

  useEffect(() => {
    fetchNewBibleVerseTranslation();
  }, [fetchNewBibleVerseTranslation]);

  const sharePdf = async () => {
    if (translation)
      await shareMarkdownPdf(
        translation,
        'New Translation',
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
  So sorry! I failed to generate a new translation for this verse. 
  
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
          {translation && (
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
              New Translation
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
              {translation || failedMarkdown}
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
