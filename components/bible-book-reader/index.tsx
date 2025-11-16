// ============================================================================
// ⚛️ React packages
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as ReactNative from 'react-native';
import {
  Animated,
  I18nManager,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

// ============================================================================
// 🧩 Expo packages
// ============================================================================

import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';

// ============================================================================
// 📦 Other external packages
// ============================================================================

import { FlashList, FlashListRef } from '@shopify/flash-list';

// ============================================================================
// 🏠 Internal assets
// ============================================================================

import { bookCovers } from '@/assets/images/book-covers';
import RNCViewPager, {
  Commands as BibleBookReaderNativeCommands,
  OnPageScrollEventData,
  OnPageScrollStateChangedEventData,
  OnPageSelectedEventData,
} from '@/components/bible-book-reader/native-component';
import { BibleChapterSummary } from '@/components/bible-chapter-summary';
import { CenteredActivityIndicator } from '@/components/centered-activity-indicator';
import { Dropdown } from '@/components/dropdown';
import { IconSymbol } from '@/components/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useAppContext } from '@/hooks/use-app-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useVerseContextMenu } from '@/hooks/use-verse-context-menu';
import type { BibleChapterPage, Verse } from '@/types';
import { getBibleBookChapterCount, getBibleBookList } from '@/utilities/bible';
import { getLargeCache, setLargeCache } from '@/utilities/cache';

// ============================================================================
// ⚙️ Function Component & Props
// ============================================================================

type BibleBookReaderProps = {
  version: string;
  timestamp: string;
};

export function BibleBookReader({ version, timestamp }: BibleBookReaderProps) {
  // ============================================================================
  // 🪝 HOOKS (Derived Values)
  // ============================================================================
  const {
    readingLocation: savedReadingLocation,
    constructStorageKey,
    constructAPIUrl,
  } = useAppContext();
  const navigation = useNavigation();
  const onContextMenu = useVerseContextMenu();
  const { height: windowHeight } = useWindowDimensions();

  const cardBackground = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');
  const verseNumberColor = useThemeColor({}, 'verseNumber');

  // ============================================================================
  // 🔄 STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<string>(
    `${savedReadingLocation.bible.book}:${savedReadingLocation.bible.chapter}`,
  );
  const [page, setPage] = useState<number>(savedReadingLocation.bible.page);
  const [verse, setVerse] = useState(savedReadingLocation.bible.page);
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [pages, setPages] = useState<BibleChapterPage[] | null>(null);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [coverVisible, setCoverVisible] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  // ============================================================================
  // 🔗 REF
  // ============================================================================

  const nativeRef = useRef<any>(null);
  const isScrollingRef = useRef(false);
  const prevScrollState = useRef<'idle' | 'dragging' | 'settling'>('idle');
  const userSelectedVerse = useRef(false);
  const flashListRef = useRef<FlashListRef<Verse>>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  // const lastManualSelectionRef = useRef<number | null>(null);

  // ============================================================================
  // 📐 CONSTANTS
  // ============================================================================

  const buffer = Math.max(200, windowHeight * 0.15);
  const safeViewHeight = windowHeight - buffer;

  const bibleBooks = getBibleBookList();

  // ============================================================================
  // 🧠 MEMOS & CALLBACKS (DERIVED LOGIC)
  // ============================================================================

  const getBookChapter = useCallback((loc: string) => {
    const [b, c] = loc.split(':');
    return { book: b.trim(), chapter: Number(c) };
  }, []);

  const { book, chapter } = useMemo(() => getBookChapter(location), [location, getBookChapter]);

  const updateLocation = useCallback((book: string, chapter: number, page?: number) => {
    setLocation(`${book}:${chapter}`);
    if (page) setPage(page);
  }, []);

  const chapterCount = useMemo(() => getBibleBookChapterCount(book), [book]);

  const resolvedLayoutDirection = useMemo(() => {
    return I18nManager.isRTL ? 'rtl' : 'ltr';
  }, []);

  const getFirstVerseOnPage = useCallback((pageNumber: number, map: Record<number, number>) => {
    const found = Object.entries(map).find(([_, page]) => page === pageNumber);
    return found ? Number(found[0]) : 0;
  }, []);

  const totalChapterVerseCount = useMemo(() => {
    try {
      if (verses) return verses.length;
      if (pages) return pages.reduce((sum, p) => sum + p.verses.length, 0);
    } catch (error) {
      console.error('ViewableVersesPage.useMemo() => totalChapterVerseCount()', error);
    }
    return 0;
  }, [verses, pages]);

  const verseToPageMap = useMemo(() => {
    if (!pages) return {};

    const map: Record<number, number> = {};

    for (const p of pages) {
      for (const v of p.verses) {
        map[v.verse] = p.pageNumber;
      }
    }

    return map;
  }, [pages]);

  const handlePagingTransition = useCallback(
    (transition: 'NEXT_PAGE' | 'PREV_PAGE') => {
      const chapterCount = getBibleBookChapterCount(book);

      // Going NEXT
      if (transition === 'NEXT_PAGE') {
        if (chapter < chapterCount) {
          updateLocation(book, chapter + 1);
        } else {
          const bookIndex = bibleBooks.indexOf(book);
          if (bookIndex < bibleBooks.length - 1) {
            updateLocation(bibleBooks[bookIndex + 1], chapter);
          }
        }
      }

      // Going PREVIOUS
      if (transition === 'PREV_PAGE') {
        if (chapter > 1) {
          updateLocation(book, chapter - 1, -1);
        } else {
          const bookIndex = bibleBooks.indexOf(book);
          if (bookIndex > 0) {
            const prevBook = bibleBooks[bookIndex - 1];
            const lastChapter = getBibleBookChapterCount(prevBook);
            updateLocation(prevBook, lastChapter, -1);
          }
        }
      }
    },
    [book, chapter, updateLocation, bibleBooks],
  );

  const measureView = useMemo(() => {
    if (!verses || pages) return null;
    // console.log(`PROFILING LOG: Measuring Chapter ${chapter} Pages: Render`);
    return (
      <>
        <CenteredActivityIndicator hint="Loading Chapter" size="large" />
        <View
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          {verses.map((verse, i) => (
            <View
              key={verse.verse}
              onLayout={(e) => {
                try {
                  const { height } = e.nativeEvent.layout;
                  setHeights((prev) => ({
                    ...prev,
                    [i]: height,
                  }));
                } catch (error) {
                  console.error(
                    'ViewableVersesPage.useMemo() => measureView() => onLayout()',
                    error,
                  );
                }
              }}
            >
              <View style={{ marginVertical: 7, paddingHorizontal: 16 }}>
                <ThemedText type="subtitle">
                  <ThemedText type="defaultSemiBold" style={{ fontWeight: 'bold', color: '#000' }}>
                    {'     '}
                    {verse.verse}
                    {'   '}
                  </ThemedText>
                  {verse.text}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      </>
    );
  }, [verses, pages]);

  // ============================================================================
  // 🎛 HANDLERS
  // ============================================================================

  const onPageTurn = useCallback(
    ({
      nativeEvent: { position, offset },
    }: ReactNative.NativeSyntheticEvent<OnPageScrollEventData>) => {
      if (!isScrollingRef.current) return;

      // Overscroll at end → next chapter or next book
      if (position >= (pages?.length ?? 0) && offset > 0) {
        handlePagingTransition('NEXT_PAGE');
      }

      // Overscroll at beginning → previous chapter/book
      if (position < 0 && offset > 0) {
        handlePagingTransition('PREV_PAGE');
      }
    },
    [pages?.length, handlePagingTransition],
  );

  const onPageTurnStateChanged = useCallback(
    (e: ReactNative.NativeSyntheticEvent<OnPageScrollStateChangedEventData>) => {
      const { pageScrollState } = e.nativeEvent;
      isScrollingRef.current = pageScrollState === 'dragging';

      if (Platform.OS === 'android') {
        if (prevScrollState.current === 'dragging' && pageScrollState === 'idle') {
          const currentPosition = page;
          const totalVersePages = pages?.length ?? 0;
          const totalPages = 1 + totalVersePages; // summary + verse pages

          // Overscroll at beginning → previous chapter/book
          if (currentPosition === 0) {
            handlePagingTransition('PREV_PAGE');
          }

          // Overscroll at end → next chapter or next book
          else if (currentPosition === totalPages - 1) {
            handlePagingTransition('NEXT_PAGE');
          }
        }
      }

      prevScrollState.current = pageScrollState; // NEW: Update previous state
    },
    [page, pages?.length, handlePagingTransition],
  );

  const onPageTurned = useCallback(
    (e: ReactNative.NativeSyntheticEvent<OnPageSelectedEventData>) => {
      if (!isScrollingRef.current) return;
      setPage(e.nativeEvent.position);
    },
    [],
  );

  const onShouldCapture = useCallback(() => {
    return isScrollingRef.current;
  }, []);

  // ============================================================================
  // ⚡️ EFFECTS
  // ============================================================================

  useEffect(() => {
    setLoading(true);

    async function loadBibleChapterVerses() {
      if (!version || !book || !chapter) return;

      // --- STEP 1: Try local cache ---
      const storageKey = constructStorageKey({
        version,
        book,
        chapter,
        suffix: 'pages',
      });

      try {
        const cached = await getLargeCache<BibleChapterPage[]>(storageKey);
        if (cached) {
          setPages(cached);
          setLoading(false);
          setVerses(null);
          setHeights({});

          console.log(
            'BibleBookReader.useEffect() => loadBibleChapterVerses() => getLargeCache()',
            storageKey,
            'found',
          );

          return;
        } else {
          console.warn(
            'BibleBookReader.useEffect() => loadBibleChapterVerses() => getLargeCache()',
            storageKey,
            'expired or missing',
          );
        }
      } catch (error) {
        console.error(
          'BibleBookReader.useEffect() => loadBibleChapterVerses() => getLargeCache()',
          storageKey,
          error,
        );
      }

      // --- STEP 2: Try to fetch from Azure Storage directly ---
      const apiUrl = constructAPIUrl(`bible/${version}/${book}/${chapter}`);

      try {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const verses = (await res.json()) as Verse[];
          setVerses(verses);

          console.log(
            'BibleBookReader.useEffect() => loadBibleChapterVerses() => fetch()',
            apiUrl,
            `HTTP STATUS ${res.status}: ${res.statusText || 'unknown'}`,
          );
        } else {
          console.warn(
            'BibleBookReader.useEffect() => loadBibleChapterVerses() => fetch()',
            apiUrl,
            `HTTP STATUS ${res.status}: ${res.statusText || 'unknown'}`,
          );
        }
      } catch (error) {
        console.error(
          'BibleBookReader.useEffect() => loadBibleChapterVerses() => fetch()',
          apiUrl,
          error,
        );
      }
    }

    loadBibleChapterVerses();
  }, [version, book, chapter, constructStorageKey, constructAPIUrl]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <IconSymbol
            name="chevron.down"
            size={22}
            color={accentColor}
            style={{ marginRight: 6 }}
          />
          <ThemedText type="subtitle">{`${book} ${chapter}`}</ThemedText>
        </TouchableOpacity>
      ),
    });
  }, [navigation, book, chapter, accentColor]);

  useEffect(() => {
    let timer = 0;

    function showBookCover() {
      try {
        // Reset state whenever timestamp changes
        setCoverVisible(true);
        fadeAnim.setValue(1);

        // Fade out after 1.5 seconds
        timer = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }).start(() => setCoverVisible(false));
        }, 1500);
      } catch (error) {
        console.error('BibleBookReader.useEffect() => showBookCover()', error);
      }
    }

    showBookCover();

    return () => clearTimeout(timer);
  }, [fadeAnim, timestamp]);

  useEffect(() => {
    function measureChapterPages() {
      try {
        if (!verses || Object.keys(heights).length !== verses.length) return;

        // console.log(`PROFILING LOG: Measuring Chapter ${chapter} Pages: useEffect`);
        const pages: BibleChapterPage[] = [];
        let currentPage: Verse[] = [];
        let totalHeight = 0;
        let pageNumber = 1; // (verses actually start on index 1 of pager view)
        let startsAt = verses[0]?.verse ?? 1;

        verses.forEach((verse, i) => {
          totalHeight += heights[i];
          currentPage.push(verse);

          if (totalHeight >= safeViewHeight || i === verses.length - 1) {
            pages.push({
              pageNumber,
              verses: currentPage,
              startsAtVerse: startsAt,
              lastVerseVisible: i === verses.length - 1,
            });
            pageNumber++;
            startsAt = verse.verse + 1;
            totalHeight = 0;
            currentPage = [];
          }
        });

        const storageKey = constructStorageKey({
          version,
          book,
          chapter,
          suffix: 'pages',
        });

        setPages(pages);
        setLargeCache(storageKey, pages);
        setLoading(false);
      } catch (error) {
        console.error('BibleBookReader.useEffect() => measureChapterPages()', error);
      }
    }

    measureChapterPages();
  }, [version, book, chapter, heights, safeViewHeight, verses, constructStorageKey]);

  useEffect(() => {
    function triggerPageJump() {
      if (!nativeRef.current) return;
      if (page == null) return;

      try {
        // If user didn't manually drag, trigger programmatic jump
        if (!isScrollingRef.current) {
          const goToPage = page === -1 ? (pages?.length ?? 0) : page;
          requestAnimationFrame(() =>
            BibleBookReaderNativeCommands.setPageWithoutAnimation(nativeRef.current, goToPage),
          );
        }
      } catch (error) {
        console.error('BibleBookReader.useEffect() => triggerPageJump()', error);
      }
    }

    triggerPageJump();
  }, [page, pages?.length]);

  useEffect(() => {
    if (!verseToPageMap) return;

    function setPickerToFirstVerseOnPage() {
      // If user triggered the page change, do NOT override
      if (userSelectedVerse.current) {
        userSelectedVerse.current = false;
        return;
      }

      setVerse(getFirstVerseOnPage(page, verseToPageMap));
    }

    setPickerToFirstVerseOnPage();
  }, [page, verseToPageMap, getFirstVerseOnPage]);

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      {coverVisible && (
        <Animated.View style={[styles.bookCoverContainer, { opacity: fadeAnim }]}>
          <Image style={styles.bookCover} source={bookCovers[version]} contentFit="fill" />
        </Animated.View>
      )}
      <RNCViewPager
        ref={nativeRef}
        initialPage={page}
        overdrag={true} // iOS
        overScrollMode="always" // Android
        layoutDirection={resolvedLayoutDirection}
        onPageScroll={onPageTurn}
        onPageScrollStateChanged={onPageTurnStateChanged}
        onPageSelected={onPageTurned}
        onMoveShouldSetResponderCapture={onShouldCapture}
        style={styles.pager}
      >
        {useMemo(
          () => (
            <View
              key={`summary-${book}-${chapter}`}
              style={[StyleSheet.absoluteFill, styles.page]}
              collapsable={false}
            >
              <BibleChapterSummary book={book} chapter={chapter} />
            </View>
          ),
          [book, chapter],
        )}
        {useMemo(() => {
          // CASE 1 — loading or no data → render placeholder as PAGE 0
          if (loading || !pages) {
            return [
              <View
                key={`measuring-verses-${book}-${chapter}`}
                style={[StyleSheet.absoluteFill, styles.page]}
                collapsable={false}
              >
                {measureView}
              </View>,
            ];
          }

          // CASE 2 — render actual pages
          return pages.map((page, index) => (
            <View
              key={`verses-${book}-${chapter}-${index}`}
              style={[StyleSheet.absoluteFill, styles.page]}
              collapsable={false}
            >
              <FlashList
                ref={flashListRef}
                data={page.verses}
                keyExtractor={(v) => `${book}-${chapter}-${v.verse.toString()}`}
                renderItem={({ item }) => (
                  <TouchableOpacity onLongPress={() => onContextMenu(item)}>
                    <View style={{ marginVertical: 7, paddingHorizontal: 16 }}>
                      <ThemedText type="subtitle">
                        <ThemedText
                          type="defaultSemiBold"
                          style={{ fontWeight: 'bold', color: verseNumberColor }}
                        >
                          {'     '}
                          {item.verse}
                          {'   '}
                        </ThemedText>
                        {item.text}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          ));
        }, [loading, pages, book, chapter, measureView, verseNumberColor, onContextMenu])}
      </RNCViewPager>
      {showPicker && (
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: cardBackground }]}>
            {/* HEADER */}
            <View style={modalStyles.header}>
              <ThemedText style={[modalStyles.title, { color: textColor }]}>Location</ThemedText>

              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <IconSymbol name="xmark" size={22} color={accentColor} />
              </TouchableOpacity>
            </View>

            {/* CONTENT */}
            <View style={{ width: '100%' }}>
              {/* 📖 BOOK PICKER */}
              <View style={[modalStyles.pickerContainer, { borderColor: accentColor + '40' }]}>
                <Dropdown
                  id="book"
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  items={getBibleBookList().map((bk) => ({ label: bk, value: bk }))}
                  selectedValue={book}
                  onSelect={(bk: string) => updateLocation(bk, chapter)}
                />
              </View>

              {/* 📜 CHAPTER PICKER */}
              <View style={[modalStyles.pickerContainer, { borderColor: accentColor + '40' }]}>
                <Dropdown
                  id="chapter"
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  items={Array.from({ length: chapterCount }, (_, i) => i + 1).map((ch) => ({
                    label: `Chapter ${ch}`,
                    value: ch,
                  }))}
                  selectedValue={chapter}
                  onSelect={(ch: number) => updateLocation(book, ch)}
                />
              </View>

              {/* ✝️ VERSE PICKER */}
              {totalChapterVerseCount > 0 && (
                <View style={[modalStyles.pickerContainer, { borderColor: accentColor + '40' }]}>
                  <Dropdown
                    id="verse"
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    items={[
                      { label: 'Summary', value: 0 },
                      ...Array.from({ length: totalChapterVerseCount }, (_, i) => ({
                        label: `Verse ${i + 1}`,
                        value: i + 1,
                      })),
                    ]}
                    selectedValue={verse}
                    onSelect={(vs: number) => {
                      userSelectedVerse.current = true;
                      setVerse(vs);
                      updateLocation(book, chapter, vs === 0 ? 0 : (verseToPageMap?.[vs] ?? 1));
                    }}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// 🎨 STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
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

const modalStyles = StyleSheet.create({
  overlay: {
    backgroundColor: '#00000066',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 4,
  },
});
