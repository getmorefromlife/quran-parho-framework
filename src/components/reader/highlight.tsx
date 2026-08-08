import { findHighlightRanges, type SearchMode } from "@/lib/search";

/**
 * Renders `text` with every occurrence of `query` wrapped in a gold <mark>.
 * Matches are diacritic/variant-insensitive (see search.ts highlightRegex).
 */
export function Highlight({
  text,
  query,
  mode,
}: {
  text: string;
  query: string;
  mode: SearchMode;
}) {
  if (!query.trim() || !text) return <>{text}</>;
  const ranges = findHighlightRanges(text, query, mode);
  if (ranges.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  ranges.forEach(([s, e], i) => {
    if (s > last) parts.push(text.slice(last, s));
    parts.push(
      <mark key={i} className="rounded bg-gold/30 text-inherit px-0.5">
        {text.slice(s, e)}
      </mark>,
    );
    last = e;
  });
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
