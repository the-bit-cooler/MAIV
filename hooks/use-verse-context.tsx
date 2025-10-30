import { createContext, useContext } from 'react';

export type VerseContextType = {
  verseToPageMap: Record<number, number>;
  totalChapterVerseCount: number;
};

const VerseContext = createContext<VerseContextType>({
  verseToPageMap: {},
  totalChapterVerseCount: 0,
});

export const useVerseContext = () => useContext(VerseContext);
export const VerseContextProvider = VerseContext.Provider;
