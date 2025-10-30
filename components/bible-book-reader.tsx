import BibleChapterSummary from '@/components/bible-chapter-summary';
import { CenteredActivityIndicator } from '@/components/centered-activity-indicator';
import { VerseView } from '@/components/verse-view';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useChapterPages } from '@/hooks/use-chapter-pages';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useVerseContextMenu } from '@/hooks/use-verse-context-menu';
import { Verse } from '@/types/verse';
import { getBibleBookChapterCount } from '@/utilities/get-bible-book-chapter-count';
import { getBibleBookList } from '@/utilities/get-bible-book-list';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { memo, useEffect, useRef } from 'react';
import { TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';

type BibleBookReaderParams = {
  version: string;
};

export default function BibleBookReader({ version }: BibleBookReaderParams) {
  const { readingLocation } = useAppPreferences();

  return (
    <>
      {!readingLocation && <CenteredActivityIndicator hint="Loading Chapter" size="large" />}
      {readingLocation && (
        <BibleBookReaderPages
          key={`${version}-${readingLocation.book}-${readingLocation.chapter}`}
          version={version}
        />
      )}
    </>
  );
}

type BibleBookReaderPagesParams = {
  version: string;
};

function BibleBookReaderPages({ version }: BibleBookReaderPagesParams) {
  const pagerRef = useRef<PagerView>(null);
  const userScrollRef = useRef(false);
  const hasMounted = useRef(false);
  const { readingLocation, setReadingLocation } = useAppPreferences();
  const onContextMenu = useVerseContextMenu();
  const { loading, pages, measureView } = useChapterPages(
    version,
    readingLocation.book,
    readingLocation.chapter,
  );

  useEffect(() => {
    const t = setTimeout(() => (hasMounted.current = true), 500);
    return () => clearTimeout(t);
  }, []);

  // 👇 NEW: react to external page changes (from drawer picker)
  useEffect(() => {
    if (!pagerRef.current || !pages) return;
    if (readingLocation.page == null) return;

    // Bounds check
    if (readingLocation.page < 0 || readingLocation.page >= pages.length) return;

    // If user didn't manually drag, trigger programmatic jump
    if (!userScrollRef.current) {
      pagerRef.current.setPageWithoutAnimation(readingLocation.page);
    }
  }, [readingLocation.page, pages]);

  const bibleBooks = getBibleBookList();

  return loading || !pages ? (
    <>
      <CenteredActivityIndicator hint="Loading Chapter" size="large" />
      {measureView}
    </>
  ) : (
    <PagerView
      ref={pagerRef}
      key={`${version}-${readingLocation.book}-${readingLocation.chapter}`}
      style={{ flex: 1 }}
      initialPage={readingLocation.page === -1 ? pages.length : readingLocation.page}
      overdrag={true} // iOS
      overScrollMode="always" // Android
      onPageScrollStateChanged={({ nativeEvent: { pageScrollState } }) => {
        if (pageScrollState === 'dragging') userScrollRef.current = true;
      }}
      onPageScroll={({ nativeEvent: { position, offset } }) => {
        if (!hasMounted.current || !userScrollRef.current) return;
        const chapterCount = getBibleBookChapterCount(readingLocation.book);
        if (position >= pages.length && offset > 0) {
          if (readingLocation.chapter < chapterCount) {
            setReadingLocation({
              ...readingLocation,
              version,
              chapter: readingLocation.chapter + 1,
              page: 0,
            });
          } else {
            const bookIndex = bibleBooks.indexOf(readingLocation.book);
            if (bookIndex < bibleBooks.length - 1) {
              setReadingLocation({
                ...readingLocation,
                version,
                book: bibleBooks[bookIndex + 1],
                chapter: 1,
                page: 0,
              });
            }
          }
        }

        if (position < 0 && offset > 0) {
          if (readingLocation.chapter > 1) {
            setReadingLocation({
              ...readingLocation,
              version,
              chapter: readingLocation.chapter - 1,
              page: -1,
            });
          } else {
            const bookIndex = bibleBooks.indexOf(readingLocation.book);
            if (bookIndex > 0) {
              const prevBook = bibleBooks[bookIndex - 1];
              const prevBookChapterCount = getBibleBookChapterCount(prevBook);
              setReadingLocation({
                ...readingLocation,
                version,
                book: prevBook,
                chapter: prevBookChapterCount,
                page: -1,
              });
            }
          }
        }
      }}
      onPageSelected={({ nativeEvent: { position } }) => {
        if (!hasMounted.current || !userScrollRef.current) return;
        setReadingLocation({
          ...readingLocation,
          version,
          page: position,
        });
        userScrollRef.current = false;
      }}>
      <ChapterSummary
        key={`summary-${readingLocation.chapter}`}
        book={readingLocation.book}
        chapter={readingLocation.chapter}
      />
      {pages.map((page, pageIdx) => (
        <Page
          key={`page-${pageIdx}`}
          chapter={readingLocation.chapter}
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
