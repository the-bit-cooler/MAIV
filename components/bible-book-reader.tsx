import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';

import { FlashList, FlashListRef } from '@shopify/flash-list';

import { bookCovers } from '@/assets/images/book-covers';
import BibleChapterSummary from '@/components/bible-chapter-summary';
import { BibleReadingLocationPicker } from '@/components/bible-reading-location-picker';
import { CenteredActivityIndicator } from '@/components/centered-activity-indicator';
import { IconSymbol } from '@/components/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { VerseView } from '@/components/verse-view';
import { useAppContext } from '@/hooks/use-app-context';
import { useChapterPages } from '@/hooks/use-chapter-pages';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useVerseContextMenu } from '@/hooks/use-verse-context-menu';
import { Verse } from '@/types/verse';
import { getBibleBookChapterCount } from '@/utilities/get-bible-book-chapter-count';
import { getBibleBookList } from '@/utilities/get-bible-book-list';

type BibleBookReaderParams = {
  version: string;
  timestamp: string;
};

export default function BibleBookReader({ version, timestamp }: BibleBookReaderParams) {
  const [showBibleReadingLocationPickerModal, setShowBibleReadingLocationPickerModal] =
    useState(false);
  const { readingLocation, setReadingLocation } = useAppContext();
  const [coverVisible, setCoverVisible] = useState(true);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Dynamically set headerTitle with the picker trigger
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => setShowBibleReadingLocationPickerModal(true)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}>
          <IconSymbol name="chevron.down" size={16} color="#666" style={{ marginRight: 6 }} />
          <ThemedText type="subtitle">
            {`${readingLocation.bible.book} ${readingLocation.bible.chapter}`}
          </ThemedText>
        </TouchableOpacity>
      ),
    });
  }, [navigation, readingLocation.bible.book, readingLocation.bible.chapter]);

  useEffect(() => {
    // Reset state whenever version changes
    setCoverVisible(true);
    fadeAnim.setValue(1);

    // Fade out after 1.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => setCoverVisible(false));
    }, 1500);

    return () => clearTimeout(timer);
  }, [fadeAnim, timestamp]); // runs once when this screen mounts

  useEffect(() => {
    // Sync drawerSelection if needed
    if (readingLocation.drawerSelection !== version) {
      setReadingLocation({ ...readingLocation, drawerSelection: version });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setReadingLocation, version]);

  return (
    <View style={styles.container}>
      {coverVisible && (
        <Animated.View style={[styles.bookCoverContainer, { opacity: fadeAnim }]}>
          <Image style={styles.bookCover} source={bookCovers[version]} contentFit="fill" />
        </Animated.View>
      )}
      {readingLocation && (
        <BibleBookReaderPages
          key={`${version}-${readingLocation.bible.book}-${readingLocation.bible.chapter}`}
          version={version}
        />
      )}
      {readingLocation && (
        <BibleReadingLocationPicker
          showBibleReadingLocationPickerModal={showBibleReadingLocationPickerModal}
          setShowBibleReadingLocationPickerModal={setShowBibleReadingLocationPickerModal}
        />
      )}
    </View>
  );
}

type BibleBookReaderPagesParams = {
  version: string;
};

function BibleBookReaderPages({ version }: BibleBookReaderPagesParams) {
  const pagerRef = useRef<PagerView>(null);
  const userScrollRef = useRef(false);
  const hasMounted = useRef(false);
  const prevScrollState = useRef('idle'); // NEW: Track previous scroll state for Android overscroll detection
  const { readingLocation, setReadingLocation } = useAppContext();
  const onContextMenu = useVerseContextMenu();
  const { loading, pages, measureView } = useChapterPages(
    version,
    readingLocation.bible.book,
    readingLocation.bible.chapter,
  );

  useEffect(() => {
    const t = setTimeout(() => (hasMounted.current = true), 500);
    return () => clearTimeout(t);
  }, []);

  // 👇 NEW: react to external page changes (from drawer picker)
  useEffect(() => {
    if (!pagerRef.current || !pages) return;
    if (readingLocation.bible.page == null) return;

    // Bounds check
    if (readingLocation.bible.page < 0 || readingLocation.bible.page >= pages.length) return;

    // If user didn't manually drag, trigger programmatic jump
    if (!userScrollRef.current) {
      pagerRef.current.setPageWithoutAnimation(readingLocation.bible.page);
    }
  }, [readingLocation.bible.page, pages]);

  const bibleBooks = getBibleBookList();

  return loading || !pages ? (
    <>
      <CenteredActivityIndicator hint="Loading Chapter" size="large" />
      {measureView}
    </>
  ) : (
    <PagerView
      ref={pagerRef}
      key={`${version}-${readingLocation.bible.book}-${readingLocation.bible.chapter}`}
      style={{ flex: 1 }}
      initialPage={readingLocation.bible.page === -1 ? pages.length : readingLocation.bible.page}
      overdrag={true} // iOS
      overScrollMode="always" // Android
      onPageScrollStateChanged={({ nativeEvent: { pageScrollState } }) => {
        if (pageScrollState === 'dragging') userScrollRef.current = true;

        // NEW: Android-specific overscroll detection via state transition
        if (Platform.OS === 'android') {
          if (prevScrollState.current === 'dragging' && pageScrollState === 'idle') {
            const currentPosition = readingLocation.bible.page;
            const totalVersePages = pages.length;
            const totalPages = 1 + totalVersePages; // summary + verse pages

            // Overscroll at beginning (attempt to go previous)
            if (currentPosition === 0) {
              if (readingLocation.bible.chapter > 1) {
                setReadingLocation({
                  ...readingLocation,
                  bible: {
                    ...readingLocation.bible,
                    chapter: readingLocation.bible.chapter - 1,
                    page: -1,
                  },
                });
              } else {
                const bookIndex = bibleBooks.indexOf(readingLocation.bible.book);
                if (bookIndex > 0) {
                  const prevBook = bibleBooks[bookIndex - 1];
                  const prevBookChapterCount = getBibleBookChapterCount(prevBook);
                  setReadingLocation({
                    ...readingLocation,
                    bible: {
                      book: prevBook,
                      chapter: prevBookChapterCount,
                      page: -1,
                    },
                  });
                }
              }
            }

            // Overscroll at end (attempt to go next)
            else if (currentPosition === totalPages - 1) {
              const chapterCount = getBibleBookChapterCount(readingLocation.bible.book);
              if (readingLocation.bible.chapter < chapterCount) {
                setReadingLocation({
                  ...readingLocation,
                  bible: {
                    ...readingLocation.bible,
                    chapter: readingLocation.bible.chapter + 1,
                    page: 0,
                  },
                });
              } else {
                const bookIndex = bibleBooks.indexOf(readingLocation.bible.book);
                if (bookIndex < bibleBooks.length - 1) {
                  setReadingLocation({
                    ...readingLocation,
                    bible: {
                      book: bibleBooks[bookIndex + 1],
                      chapter: 1,
                      page: 0,
                    },
                  });
                }
              }
            }
          }
        }

        prevScrollState.current = pageScrollState; // NEW: Update previous state
      }}
      onPageScroll={({ nativeEvent: { position, offset } }) => {
        if (!hasMounted.current || !userScrollRef.current) return;
        const chapterCount = getBibleBookChapterCount(readingLocation.bible.book);
        if (position >= pages.length && offset > 0) {
          if (readingLocation.bible.chapter < chapterCount) {
            setReadingLocation({
              ...readingLocation,
              bible: {
                ...readingLocation.bible,
                chapter: readingLocation.bible.chapter + 1,
                page: 0,
              },
            });
          } else {
            const bookIndex = bibleBooks.indexOf(readingLocation.bible.book);
            if (bookIndex < bibleBooks.length - 1) {
              setReadingLocation({
                ...readingLocation,
                bible: {
                  book: bibleBooks[bookIndex + 1],
                  chapter: 1,
                  page: 0,
                },
              });
            }
          }
        }

        if (position < 0 && offset > 0) {
          if (readingLocation.bible.chapter > 1) {
            setReadingLocation({
              ...readingLocation,
              bible: {
                ...readingLocation.bible,
                chapter: readingLocation.bible.chapter - 1,
                page: -1,
              },
            });
          } else {
            const bookIndex = bibleBooks.indexOf(readingLocation.bible.book);
            if (bookIndex > 0) {
              const prevBook = bibleBooks[bookIndex - 1];
              const prevBookChapterCount = getBibleBookChapterCount(prevBook);
              setReadingLocation({
                ...readingLocation,
                bible: {
                  book: prevBook,
                  chapter: prevBookChapterCount,
                  page: -1,
                },
              });
            }
          }
        }
      }}
      onPageSelected={({ nativeEvent: { position } }) => {
        if (!hasMounted.current || !userScrollRef.current) return;
        setReadingLocation({
          ...readingLocation,
          bible: {
            ...readingLocation.bible,
            page: position,
          },
        });
        userScrollRef.current = false;
      }}>
      <ChapterSummary
        key={`summary-${readingLocation.bible.chapter}`}
        book={readingLocation.bible.book}
        chapter={readingLocation.bible.chapter}
      />
      {pages.map((page, pageIdx) => (
        <Page
          key={`page-${pageIdx}`}
          chapter={readingLocation.bible.chapter}
          page={page.pageNumber}
          verses={page.verses}
          onContextMenu={onContextMenu}
        />
      ))}
    </PagerView>
  );
}

type ChapterSummaryProps = {
  book: string;
  chapter: number;
};

const ChapterSummary = memo(({ book, chapter }: ChapterSummaryProps) => {
  return <BibleChapterSummary book={book} chapter={chapter} />;
});
ChapterSummary.displayName = 'ChapterSummary';

type PageProps = {
  chapter: number;
  page: number;
  verses: Verse[];
  onContextMenu: (verse: Verse) => void;
};

function Page({ chapter, page, verses, onContextMenu }: PageProps) {
  const flashListRef = useRef<FlashListRef<Verse>>(null);
  const verseNumberColor = useThemeColor({}, 'verseNumber');

  useEffect(() => {
    flashListRef.current?.scrollToIndex({ index: 0, animated: false });
  }, [chapter, page]);

  return (
    <View style={{ flex: 1, paddingTop: 10 }}>
      <FlashList
        ref={flashListRef}
        data={verses}
        keyExtractor={(v) => v.verse.toString()}
        renderItem={({ item }) => (
          <VerseItem
            verse={item}
            verseNumberColor={verseNumberColor}
            onContextMenu={onContextMenu}
          />
        )}
      />
    </View>
  );
}

type VerseItemProps = {
  verse: Verse;
  verseNumberColor: string;
  onContextMenu: (verse: Verse) => void;
};

const VerseItem = memo(({ verse, verseNumberColor, onContextMenu }: VerseItemProps) => {
  return (
    <TouchableOpacity onLongPress={() => onContextMenu(verse)}>
      <VerseView verse={verse} verseNumberColor={verseNumberColor} />
    </TouchableOpacity>
  );
});
VerseItem.displayName = 'VerseItem';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bookCoverContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  bookCover: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
