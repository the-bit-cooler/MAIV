import { Verse } from '@/types/verse';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Share } from 'react-native';

export function useVerseContextMenu() {
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();

  const onContextMenu = useCallback(
    (verse: Verse) => {
      // Build options dynamically
      const options = [
        'Explain Verse',
        'Translate Verse',
        'Find Similar Verses',
        'Compare Versions',
        'Illustrate Verse',
        'Copy Verse',
        'Share Verse',
        'Cancel',
      ];

      showActionSheetWithOptions(
        {
          options,
          title: `${verse.book} ${verse.chapter}:${verse.verse}`,
          cancelButtonIndex: 7,
          destructiveButtonIndex: undefined,
          tintColor: '#007AFF',
        },
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
            case 'Translate Verse':
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
            case 'Find Similar Verses':
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
            case 'Illustrate Verse':
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
            case 'Copy Verse':
              await Clipboard.setStringAsync(
                `${verse.book} ${verse.chapter}:${verse.verse} — ${verse.text}`,
              );
              Alert.alert('Copied!', 'Verse copied to clipboard.');
              break;
            case 'Share Verse':
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
