import AiThinkingIndicator from '@/components/ai-thinking-indicator';
import { IconSymbol } from '@/components/icon-symbol';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { blurhash } from '@/constants/blur-hash';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBibleVersionDisplayName } from '@/utilities/get-bible-version-info';
import { shareIllustrationPdf } from '@/utilities/share-illustration-pdf';
import { PlatformPressable } from '@react-navigation/elements';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type BibleVerseIllustrationRouteParams = {
  version: string;
  book: string;
  chapter: string;
  verse: string;
  text: string;
};

export default function BibleVerseIllustrationModal() {
  const { version, book, chapter, verse, text } =
    useLocalSearchParams<BibleVerseIllustrationRouteParams>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ use theme defaults
  const headerBackgroundColor = useThemeColor({}, 'cardBackground');
  const iconColor = useThemeColor({}, 'tint');

  const fetchBibleVerseIllustration = useCallback(async () => {
    setLoading(true);

    // Construct known storage URL
    const storageUrl = `${process.env.EXPO_PUBLIC_AZURE_STORAGE_URL}illustration/${version}/${book.replace(/ /g, '')}/${chapter}/${verse}.png`;

    try {
      // --- STEP 1: Check if the image exists in storage ---
      try {
        const headResponse = await fetch(storageUrl, { method: 'HEAD' });
        if (headResponse.ok) {
          setImageUri(storageUrl);
          return;
        } else {
          console.warn('Illustration does not exist, will try Azure Function');
        }
      } catch (storageErr) {
        console.warn('Storage check failed, will try Azure Function:', storageErr);
      }

      // --- STEP 2: Fallback to Azure Function (generates & stores) ---
      const functionUrl = `${process.env.EXPO_PUBLIC_AZURE_FUNCTION_URL}bible/${version}/${book}/${chapter}/${verse}/illustrate?code=${process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY}`;
      const response = await fetch(functionUrl);

      if (!response.ok) {
        console.warn('Failed to get illustration URL from Azure Function');
        return;
      }

      const resultUrl = await response.text();
      if (!resultUrl) {
        console.warn('Azure Function returned empty URL');
        return;
      }

      setImageUri(resultUrl);
    } catch (err) {
      console.warn('Error fetching illustration url:', err);
    } finally {
      setLoading(false);
    }
  }, [version, book, chapter, verse]);

  useEffect(() => {
    fetchBibleVerseIllustration();
  }, [fetchBibleVerseIllustration]);

  const sharePdf = async () => {
    if (imageUri)
      await shareIllustrationPdf(imageUri, `${book} ${chapter}:${verse} (${version})`, {
        version,
        book,
        chapter,
        verse,
        text,
      });
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
          {imageUri && (
            <PlatformPressable onPress={sharePdf} style={styles.fab} pressOpacity={0.8}>
              <IconSymbol size={34} name="square.and.arrow.up" color={iconColor} />
            </PlatformPressable>
          )}
        </>
      }>
      <View style={styles.container}>
        {loading ? (
          <AiThinkingIndicator />
        ) : imageUri ? (
          <Image
            style={styles.illustration}
            source={{ uri: imageUri }}
            placeholder={{ blurhash }}
            placeholderContentFit="fill"
            contentFit="fill"
            transition={1000}
          />
        ) : (
          <View style={[styles.fenceBlock, { backgroundColor: headerBackgroundColor }]}>
            <ThemedText style={styles.fenceText}>
              So sorry! I couldn’t generate an illustration for this verse.
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    aspectRatio: 2 / 3, // 1024x1536 aspect ratio
    width: '90%',
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
