export function getFirstVerseOnPage(
  pageNumber: number,
  verseToPageMap: Record<number, number>,
): number {
  const entries = Object.entries(verseToPageMap);
  const found = entries.find(([verse, page]) => page === pageNumber); // +1 since map uses 1-based pages
  return found ? Number(found[0]) : 0;
}
