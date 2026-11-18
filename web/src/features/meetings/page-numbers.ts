// The longest shortened row: 1 … 4 5 6 … 10 (first, gap, the current page
// and its two neighbours, gap, last). Up to this many pages, all are shown.
const MAX_SLOTS = 7;

// The page numbers to show: all of them when there are few, else the first,
// the last and the ones around the current page, with gaps as "…".
export function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= MAX_SLOTS) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const shown = [1, current - 1, current, current + 1, total].filter(
    (page, i, all) => page >= 1 && page <= total && all.indexOf(page) === i,
  );
  const pages: (number | "…")[] = [];
  for (const page of shown) {
    const previous = pages.at(-1);
    if (typeof previous === "number" && page - previous > 1) pages.push("…");
    pages.push(page);
  }
  return pages;
}
