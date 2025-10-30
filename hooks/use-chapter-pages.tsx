import { VerseView } from '@/components/verse-view';
import { useVerseContext } from '@/hooks/use-verse-context';
import { Verse } from '@/types/verse';
import { getCache, setCache } from '@/utilities/cache';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, View } from 'react-native';

export type ViewableVersesPage = {
  pageNumber: number;
  verses: Verse[];
  startsAtVerse: number;
  lastVerseVisible: boolean;
};

async function fetchChapterFromAPI(
  version: string,
  book: string,
  chapter: number,
): Promise<Verse[]> {
  const url = `${process.env.EXPO_PUBLIC_AZURE_FUNCTION_URL}${version}/${book}/${chapter}?code=${process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY}`;
  const res = await fetch(url);
  if (res.ok) return (await res.json()) as Verse[];
  return [];
}

export function useChapterPages(version: string, book: string, chapter: number) {
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [pages, setPages] = useState<ViewableVersesPage[] | null>(null);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const verseContext = useVerseContext();

  const windowHeight = Dimensions.get('window').height;
  const buffer = Math.max(200, windowHeight * 0.15);
  const safeViewHeight = windowHeight - buffer;
  const storageKey = `${version}:${book}:${chapter}`;

  // Load chapter...
  useEffect(() => {
    let isMounted = true;

    async function loadBibleChapter() {
      // Clear all state...
      setLoading(true);
      setPages(null);
      setVerses(null);
      setHeights({});

      // Load cached pages if exists...
      const cached = await getCache<ViewableVersesPage[]>(storageKey);
      if (cached && isMounted) {
        setPages(cached);
        setLoading(false);
        return;
      }

      // Otherwise, call API for raw chapter data...
      const data = await fetchChapterFromAPI(version, book, chapter);
      if (isMounted) setVerses(data);
    }

    loadBibleChapter();
    return () => {
      isMounted = false;
    };
  }, [version, book, chapter, storageKey]);

  // Measure → paginate → cache...
  useEffect(() => {
    if (!verses || Object.keys(heights).length !== verses.length) return;

    const pages: ViewableVersesPage[] = [];
    let currentPage: Verse[] = [];
    let totalHeight = 0;
    let pageNumber = 1;
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

    setCache(storageKey, pages);
    setPages(pages);
    setLoading(false);
  }, [heights, safeViewHeight, storageKey, verses]);

  // Derived values (work for both cached and measured pages)
  const totalChapterVerseCount = useMemo(() => {
    if (verses) return verses.length;
    if (pages) return pages.reduce((sum, p) => sum + p.verses.length, 0);
    return 0;
  }, [verses, pages]);

  const verseToPageMap = useMemo(() => {
    if (!pages) return {};
    const map: Record<number, number> = {};
    for (const page of pages) {
      for (const v of page.verses) {
        map[v.verse] = page.pageNumber;
      }
    }
    return map;
  }, [pages]);

  // update global context once computed
  useEffect(() => {
    if (Object.keys(verseToPageMap).length && totalChapterVerseCount > 0) {
      verseContext.verseToPageMap = verseToPageMap;
      verseContext.totalChapterVerseCount = totalChapterVerseCount;
    }
  }, [verseToPageMap, totalChapterVerseCount, verseContext]);

  // Prepare hidden measurement view (only when verses need measuring)
  const measureView = useMemo(() => {
    if (!verses || pages) return null;
    return (
      <View
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
        }}>
        {verses.map((verse, i) => (
          <View
            key={verse.verse}
            onLayout={(e) => {
              const { height } = e.nativeEvent.layout;
              setHeights((prev) => ({
                ...prev,
                [i]: height,
              }));
            }}>
            <VerseView verse={verse} verseNumberColor="#000" />
          </View>
        ))}
      </View>
    );
  }, [verses, pages]);

  return {
    loading,
    pages,
    measureView,
    verseToPageMap,
    totalChapterVerseCount,
  };
}
