export type ReadingLocation = {
  drawerSelection: string;
  bible: ReadingLocationBible;
};

export type ReadingLocationBible = {
  book: string;
  chapter: number;
  page: number;
};
