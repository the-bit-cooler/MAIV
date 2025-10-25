import bookChapterCounts from '@/assets/data/bible-book-chapter-counts.json';

// Create a type for the bible versions
interface BibleBookChapterCount {
  [key: string]: number;
}

export const getBibleBookChapterCount = (key: string): number => {
  return (bookChapterCounts as BibleBookChapterCount)[key] || 0;
};
