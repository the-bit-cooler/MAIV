import newTestamentBooks from '@/assets/data/new-testament.json';
import oldTestamentBooks from '@/assets/data/old-testament.json';

export const getBibleBookList = (): string[] => {
  return getOldTestamentBibleBookList().concat(getNewTestamentBibleBookList());
};

export const getNewTestamentBibleBookList = (): string[] => {
  return newTestamentBooks;
};

export const getOldTestamentBibleBookList = (): string[] => {
  return oldTestamentBooks;
};
