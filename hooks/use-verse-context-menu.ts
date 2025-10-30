import { useActionSheet } from '@expo/react-native-action-sheet';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Platform, Share } from 'react-native';

import { Verse } from '@/types/verse';

export function useVerseContextMenu() {
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();

  const onContextMenu = useCallback(
    (verse: Verse) => {
      // Build options dynamically
      const options = [
        'Explain Verse',
        'New Translation',
        'Similar Verses',
        'Compare Versions',
        'Illustrate',
      ];
      if (Platform.OS === 'android') options.push('Copy');
      options.push('Share');

      showActionSheetWithOptions(
        { options, title: `${verse.book} ${verse.chapter}:${verse.verse}` },
        async (selectedIndex?: number) => {
          switch (options[selectedIndex!]) {
            case 'Explain Verse':
              router.push({
                pathname: '/bible-verse-explanation',
                params: {
                  version: verse.version,
                  book: verse.book,
                  chapter: verse.chapter,
                  verse: verse.verse,
                  text: verse.text,
                },
              });
              break;
            case 'New Translation':
              router.push({
                pathname: '/new-bible-verse-translation',
                params: {
                  version: verse.version,
                  book: verse.book,
                  chapter: verse.chapter,
                  verse: verse.verse,
                  text: verse.text,
                },
              });
              break;
            case 'Similar Verses':
              router.push({
                pathname: '/similar-bible-verses',
                params: {
                  version: verse.version,
                  book: verse.book,
                  chapter: verse.chapter,
                  verse: verse.verse,
                  text: verse.text,
                },
              });
              break;
            case 'Compare Versions':
              router.push({
                pathname: '/bible-verse-versions',
                params: {
                  version: verse.version,
                  book: verse.book,
                  chapter: verse.chapter,
                  verse: verse.verse,
                  text: verse.text,
                },
              });
              break;
            case 'Illustrate':
              router.push({
                pathname: '/bible-verse-illustration',
                params: {
                  version: verse.version,
                  book: verse.book,
                  chapter: verse.chapter,
                  verse: verse.verse,
                  text: verse.text,
                },
              });
              break;
            case 'Copy':
              await Clipboard.setStringAsync(
                `${verse.book} ${verse.chapter}:${verse.verse} — ${verse.text}`,
              );
              Alert.alert('Copied!', 'Verse copied to clipboard.');
              break;
            case 'Share':
              try {
                await Share.share({
                  message: `${verse.book} ${verse.chapter}:${verse.verse} — ${verse.text}`,
                });
              } catch (error) {
                console.error('Error sharing verse:', error);
              }
              break;
            default:
              break;
          }
        },
      );
    },
    [showActionSheetWithOptions, router],
  );

  return onContextMenu;
}
