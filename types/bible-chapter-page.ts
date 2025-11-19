import { Verse } from '@/types/verse';

export type BibleChapterPage = {
  pageNumber: number;
  verses: Verse[];
  startsAtVerse: number;
  lastVerseVisible: boolean;
};
