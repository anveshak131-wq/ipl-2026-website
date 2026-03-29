// Needs to be higher than the maximum match id used in the dataset (e.g. `772`),
// otherwise Next will 404 for `/matches/[matchId]` when `dynamicParams = false`.
const DEFAULT_STATIC_MATCH_PAGE_COUNT = 2000;
const MAX_STATIC_MATCH_PAGE_COUNT = 5000;

function resolveStaticPageCount(): number {
  const raw = process.env.NEXT_STATIC_MATCH_PAGE_COUNT;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_STATIC_MATCH_PAGE_COUNT;
  }

  return Math.min(parsed, MAX_STATIC_MATCH_PAGE_COUNT);
}

export function getStaticMatchRouteParams() {
  const total = resolveStaticPageCount();
  return Array.from({ length: total }, (_, index) => ({
    matchId: String(index + 1),
  }));
}
