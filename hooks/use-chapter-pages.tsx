import { useEffect, useMemo, useState } from 'react';
import { Dimensions, View } from 'react-native';

import { getCache, setCache } from '@/utilities/cache';

import { VerseView } from '@/components/verse-view';

import { Verse } from '@/types/verse';

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

  const windowHeight = Dimensions.get('window').height;
  const buffer = Math.max(200, windowHeight * 0.15); // Fixed 100px or 15% of height, whichever is larger
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

  return { loading, pages, measureView };
}
