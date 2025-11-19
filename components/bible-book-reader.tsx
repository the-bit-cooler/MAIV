// ============================================================================
// ⚛️ React packages
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as ReactNative from 'react-native';
import {
  Animated,
  AppState,
  I18nManager,
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
import { BibleChapterSummary } from '@/components/bible-chapter-summary';
import { BibleCopyrightPage } from '@/components/bible-version-copyright';
import { CenteredActivityIndicator } from '@/components/centered-activity-indicator';
import { Dropdown } from '@/components/dropdown';
import { IconSymbol } from '@/components/icon-symbol';
import RNCViewPager, {
  Commands as BibleBookReaderNativeCommands,
  OnPageScrollStateChangedEventData,
  OnPageSelectedEventData,
} from '@/components/pager-view';
import { ThemedText } from '@/components/themed-text';
import { CacheKeys } from '@/constants';
import { useAppContext, useThemeColor, useVerseContextMenu } from '@/hooks';
import type { BibleChapterPage, PageState, ReadingLocation, Verse } from '@/types';
import {
  getBibleBookChapterCount,
  getBibleBookList,
  getLargeCache,
  setCache,
  setLargeCache,
} from '@/utilities';

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
  const [isPagerReady, setIsPagerReady] = useState(false);
  const [location, setLocation] = useState<string>(
    `${savedReadingLocation.bible.book}:${savedReadingLocation.bible.chapter}`,
  );
  const [page, setPage] = useState<PageState>({
    location: location,
    at: savedReadingLocation.bible.page,
  });
  const [verse, setVerse] = useState(0);
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
  const isFirstMount = useRef(true);
  const isScrollingRef = useRef(false);
  const userSelectedVerseRef = useRef(false);
  const flashListRef = useRef<FlashListRef<Verse>>(null);
  const fadeAnimRef = useRef(new Animated.Value(1)).current;

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

  const chapterCount = getBibleBookChapterCount(book);

  const isStartOfBible = book === 'Genesis' && chapter === 1;

  const isEndOfBible = book === 'Revelation' && chapter === chapterCount;

  const updateLocation = useCallback((book: string, chapter: number, page?: number) => {
    const newLocation = `${book}:${chapter}`;
    setLocation(newLocation);
    setPage({ location: newLocation, at: page ?? 0 });
  }, []);

  const resolvedLayoutDirection = useMemo(() => {
    return I18nManager.isRTL ? 'rtl' : 'ltr';
  }, []);

  const getFirstVerseOnPage = useCallback((pageNumber: number, map: Record<number, number>) => {
    const found = Object.entries(map).find(([_, page]) => page === pageNumber);
    return found ? Number(found[0]) : 0;
  }, []);

  const totalChapterVerseCount = useMemo(() => {
    if (!pages?.length) return 0;
    return pages.reduce((sum, p) => sum + p.verses.length, 0);
  }, [pages]);

  const verseToPageMap = useMemo(() => {
    if (!pages?.length) return {};

    const map: Record<number, number> = {};

    for (const p of pages) {
      for (const v of p.verses) {
        map[v.verse] = p.pageNumber;
      }
    }

    return map;
  }, [pages]);

  // ============================================================================
  // 🎛 HANDLERS
  // ============================================================================

  const onPageTurnStateChanged = useCallback(
    ({
      nativeEvent: { pageScrollState },
    }: ReactNative.NativeSyntheticEvent<OnPageScrollStateChangedEventData>) => {
      if (pageScrollState === 'dragging') {
        isScrollingRef.current = true;
      }
    },
    [],
  );

  const onPageTurned = useCallback(
    ({ nativeEvent: { position } }: ReactNative.NativeSyntheticEvent<OnPageSelectedEventData>) => {
      if (!isScrollingRef.current || !pages?.length) return;

      const totalPages = 1 + pages.length + 2; // summary + verse pages + 2 placeholders
      const lastIndex = totalPages - 1;

      const book = pages[0].verses[0].book;
      const chapter = pages[0].verses[0].chapter;
      const chapterCount = getBibleBookChapterCount(book);
      const isStartOfBible = book === 'Genesis';
      const isEndOfBible = book === 'Revelation';

      // <-- PREVIOUS Chapter or Book-->
      if (position === 0) {
        if (chapter > 1) {
          updateLocation(book, chapter - 1, -1);
        } else if (!isStartOfBible) {
          console.log('GO TO PREV BOOK');
          const bookIndex = bibleBooks.indexOf(book);
          if (bookIndex > 0) {
            const prevBook = bibleBooks[bookIndex - 1];
            const lastChapter = getBibleBookChapterCount(prevBook);
            updateLocation(prevBook, lastChapter, -1);
          }
        }
      }

      // <-- NEXT Chapter or Book -->
      else if (position === lastIndex) {
        if (chapter < chapterCount) {
          updateLocation(book, chapter + 1);
        } else if (!isEndOfBible) {
          console.log('GO TO NEXT BOOK');
          const bookIndex = bibleBooks.indexOf(book);
          if (bookIndex < bibleBooks.length - 1) {
            updateLocation(bibleBooks[bookIndex + 1], 1);
          }
        }
      }

      isScrollingRef.current = false;
    },
    [pages, bibleBooks, updateLocation],
  );

  const onShouldCapture = useCallback(() => {
    return isScrollingRef.current;
  }, []);

  // ============================================================================
  // ⚡️ EFFECTS
  // ============================================================================

  useEffect(() => {
    // --- Reset state for new chapter/book ---
    setIsPagerReady(false);
    setPages(null);
    setVerses(null);
    setHeights({});
    setLoading(true);

    async function loadBibleChapterVerses() {
      const { book, chapter } = getBookChapter(location);

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
  }, [version, location, getBookChapter, constructStorageKey, constructAPIUrl]);

  useEffect(() => {
    const { book, chapter } = getBookChapter(location);

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
  }, [navigation, location, accentColor, getBookChapter]);

  useEffect(() => {
    let timer = 0;

    function showBookCover() {
      try {
        // Reset state whenever timestamp changes
        setCoverVisible(true);
        fadeAnimRef.setValue(1);

        // Fade out after 1.5 seconds
        timer = setTimeout(() => {
          Animated.timing(fadeAnimRef, {
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
  }, [fadeAnimRef, timestamp]);

  useEffect(() => {
    function measureChapterPages() {
      try {
        if (!verses?.length || Object.keys(heights).length !== verses.length) return;

        const pages: BibleChapterPage[] = [];
        let currentPage: Verse[] = [];
        let totalHeight = 0;
        let pageNumber = 1; // (verses actually start on index 1 of pager view)
        let startsAt = verses[0].verse;

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
          book: verses[0].book,
          chapter: verses[0].chapter,
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
  }, [version, heights, safeViewHeight, verses, constructStorageKey]);

  useEffect(() => {
    if (!pages?.length) return;

    requestAnimationFrame(() => {
      setIsPagerReady(true);
    });
  }, [pages]);

  useEffect(() => {
    const saveReadingLocation = async () => {
      if (book && chapter && page && !isFirstMount.current) {
        try {
          const readingLocation: ReadingLocation = {
            drawerSelection: version,
            bible: {
              book,
              chapter,
              page: page.at > 0 ? page.at : 1,
            },
          };
          await setCache(CacheKeys.reading_location, readingLocation);
        } catch (error) {
          console.error('BibleBookReader.useEffect() => saveReadingLocation()', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'background') await saveReadingLocation(); // Save when app is placed in background
    });

    return () => {
      subscription.remove();
      saveReadingLocation(); // Save on unmount
    };
  }, [version, book, chapter, page]);

  useEffect(() => {
    function triggerPageJump() {
      if (!isPagerReady) return;
      if (!nativeRef.current) return;
      if (!pages?.length) return;

      // abort the very first mount — pager is already naturally at correct position
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }

      const book = pages[0].verses[0].book;
      const chapter = pages[0].verses[0].chapter;
      const currentLocation = `${book}:${chapter}`;

      // Only jump if location matches
      if (page.location !== currentLocation) return;

      try {
        // If user didn't manually drag, trigger programmatic jump
        if (!isScrollingRef.current) {
          const goToPage = page.at === -1 ? pages.length + 1 : page.at + 1; // account for summary + placeholder pages
          requestAnimationFrame(() => {
            BibleBookReaderNativeCommands.setPageWithoutAnimation(nativeRef.current, goToPage);
          });
        }
      } catch (error) {
        console.error('BibleBookReader.useEffect() => triggerPageJump()', error);
      }
    }

    triggerPageJump();
  }, [isPagerReady, page, pages]);

  useEffect(() => {
    function setPickerToFirstVerseOnPage() {
      // If user triggered the page change, do NOT override
      if (userSelectedVerseRef.current) {
        userSelectedVerseRef.current = false;
        return;
      }

      setVerse(getFirstVerseOnPage(page.at, verseToPageMap));
    }

    setPickerToFirstVerseOnPage();
  }, [page, verseToPageMap, getFirstVerseOnPage]);

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      {coverVisible && (
        <Animated.View style={[styles.bookCoverContainer, { opacity: fadeAnimRef }]}>
          <Image style={styles.bookCover} source={bookCovers[version]} contentFit="fill" />
        </Animated.View>
      )}
      {/* Measuring view (always renders when needed, independent of ViewPager) */}
      {verses?.length && !pages?.length && (
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
                  console.error('BibleBookReader.render() => measureView => onLayout()', error);
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
      )}
      <RNCViewPager
        ref={nativeRef}
        initialPage={page.at}
        overdrag={false} // iOS
        overScrollMode="never" // Android
        layoutDirection={resolvedLayoutDirection}
        onPageScrollStateChanged={onPageTurnStateChanged}
        onPageSelected={onPageTurned}
        onMoveShouldSetResponderCapture={onShouldCapture}
        style={styles.pager}
      >
        {/* Start placeholder page used to help track swipes back beyond the first page */}
        {isStartOfBible ? (
          <View
            key={`book-coverr`}
            style={[StyleSheet.absoluteFill, styles.page]}
            collapsable={false}
          >
            <Image style={styles.bookCover} source={bookCovers[version]} contentFit="fill" />
          </View>
        ) : (
          <View
            key={`start-placeholder`}
            style={[StyleSheet.absoluteFill, styles.page]}
            collapsable={false}
          >
            <CenteredActivityIndicator hint="Loading Chapter" size="large" />
          </View>
        )}
        {/* Summary page */}
        <View
          key={`summary-${book}-${chapter}`}
          style={[StyleSheet.absoluteFill, styles.page]}
          collapsable={false}
        >
          <BibleChapterSummary book={book} chapter={chapter} />
        </View>
        {/* Verse pages */}
        {(() => {
          if (loading || !pages?.length) {
            return (
              <View
                key="loading-verses"
                style={[StyleSheet.absoluteFill, styles.page]}
                collapsable={false}
              >
                <CenteredActivityIndicator hint="Loading Verses" size="large" />
              </View>
            );
          }

          const book = pages[0].verses[0].book;
          const chapter = pages[0].verses[0].chapter;

          return pages.map((page, index) => (
            <View
              key={`verses-${book}-${chapter}-${index}`}
              style={[StyleSheet.absoluteFill, styles.page]}
              collapsable={false}
            >
              <FlashList
                ref={flashListRef}
                data={page.verses}
                keyExtractor={(v) => `${book}-${chapter}-${v.verse}`}
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
        })()}
        {/* End placeholder page used to help track swipes beyond the last page */}
        {isEndOfBible ? (
          <View
            key={`copyright-page`}
            style={[StyleSheet.absoluteFill, styles.page]}
            collapsable={false}
          >
            <BibleCopyrightPage version={version} />
          </View>
        ) : (
          <View
            key={`end-placeholder`}
            style={[StyleSheet.absoluteFill, styles.page]}
            collapsable={false}
          >
            <CenteredActivityIndicator hint="Loading Chapter" size="large" />
          </View>
        )}
      </RNCViewPager>
      {showPicker && (
        <View key={`modal-${book}-${chapter}`} style={modalStyles.overlay}>
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
                      userSelectedVerseRef.current = true;
                      setVerse(vs);
                      updateLocation(book, chapter, vs === 0 ? 0 : (verseToPageMap[vs] ?? 1));
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
