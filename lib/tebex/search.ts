import type { Category, Package } from "./types";

// Per-token match quality, used both to decide whether a token counts as
// matched at all (score > 0) and to rank results. Deliberately coarse
// tiers rather than a continuous score — keeps scoring predictable and
// easy to reason about in tests.
const NAME_EXACT = 4;
const NAME_PREFIX = 3;
const NAME_SUBSTRING = 2;
const NAME_FUZZY = 1;
// A token that only matches inside the description (never the name) is a
// weaker relevance signal than any name match, regardless of which name
// tier it would have hit — capped at a flat 1 rather than reusing the
// name tiers, so "matches somewhere in the description" can never outrank
// even a fuzzy name match.
const DESCRIPTION_MATCH = 1;
// Bonus for the *untokenized* query appearing verbatim in the name — the
// old exact-substring behavior this replaces, preserved as the strongest
// possible signal so a literal phrase match still sorts first.
const EXACT_PHRASE_BONUS = 10;

// Deliberately narrow: strips a single trailing "s" only. Closes "ranks"
// vs "rank" without attempting general English plural rules (e.g. "-es"
// after a sibilant sound, "y" -> "ies") — those add real edge cases for
// no benefit here. A naive "-es" strip was tried and rejected: it turns
// "bundles" into "bundl", which no longer matches unstripped "bundle".
function stripPluralSuffix(word: string): string {
  return word.length > 1 && word.endsWith("s") ? word.slice(0, -1) : word;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, " ") // strip HTML tags — description is rich text, see mapper.ts
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stripPluralSuffix);
}

// Damerau-Levenshtein: standard Levenshtein plus one extra check for an
// adjacent-character transposition counting as a single edit (e.g.
// "vpi" -> "vip" is 1 edit, not 2) — transpositions are a common enough
// typo pattern that plain Levenshtein alone under-tolerates them.
function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[a.length][b.length];
}

// Roughly one tolerated edit per four characters, minimum 1 — see the
// worked example in the PR discussion for why a fixed distance (rather
// than one scaled by word length) is wrong at both ends: too loose on
// short words, too strict on long ones.
function maxEditDistance(length: number): number {
  return Math.max(1, Math.floor(length / 4));
}

// Best match tier a single query token achieves against a set of target
// tokens (already tokenized the same way). 0 means no match at all.
function bestTokenScore(queryToken: string, targetTokens: string[]): number {
  let best = 0;
  for (const targetToken of targetTokens) {
    if (targetToken === queryToken) return NAME_EXACT; // can't score higher
    if (targetToken.startsWith(queryToken)) {
      best = Math.max(best, NAME_PREFIX);
    } else if (targetToken.includes(queryToken)) {
      best = Math.max(best, NAME_SUBSTRING);
    } else if (
      editDistance(queryToken, targetToken) <=
      maxEditDistance(queryToken.length)
    ) {
      best = Math.max(best, NAME_FUZZY);
    }
  }
  return best;
}

// Every query token must match somewhere (name or description) for the
// package to be included at all — returns null to signal "no match"
// rather than 0, since 0 is also a valid (if impossible in practice)
// score.
function scorePackage(
  pkg: Package,
  queryTokens: string[],
  normalizedQuery: string,
): number | null {
  const nameTokens = tokenize(pkg.name);
  const descriptionTokens = tokenize(pkg.description);

  let total = 0;
  for (const queryToken of queryTokens) {
    const nameScore = bestTokenScore(queryToken, nameTokens);
    if (nameScore > 0) {
      total += nameScore;
      continue;
    }
    if (bestTokenScore(queryToken, descriptionTokens) > 0) {
      total += DESCRIPTION_MATCH;
      continue;
    }
    return null; // this token matched nothing — package is excluded
  }

  if (pkg.name.toLowerCase().includes(normalizedQuery)) {
    total += EXACT_PHRASE_BONUS;
  }
  return total;
}

/**
 * Relevance-scored match against `getCategories()`'s already-cached result
 * — no category/package listing endpoint in Tebex's Headless API accepts a
 * search/query parameter, so this is server-side filtering over data
 * that's already been fetched, not a Tebex API call.
 *
 * Matches on package name and description, tolerates word-order
 * differences and simple plurals, and fuzzy-matches typos within a
 * length-scaled edit distance. Every query token must match something
 * (in the name or description) for a package to be included; results are
 * ranked by relevance, most relevant first, with an exact phrase match in
 * the name always sorting above a token-scattered or fuzzy match.
 * Deduplicates by package id in case the same package ever appears in
 * more than one category.
 */
export function searchPackages(
  categories: Category[],
  query: string,
): Package[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const queryTokens = tokenize(normalizedQuery);
  if (queryTokens.length === 0) return [];

  const byId = new Map<number, Package>();
  for (const category of categories) {
    for (const pkg of category.packages) {
      byId.set(pkg.id, pkg);
    }
  }

  const scored: { pkg: Package; score: number }[] = [];
  for (const pkg of byId.values()) {
    const score = scorePackage(pkg, queryTokens, normalizedQuery);
    if (score !== null) {
      scored.push({ pkg, score });
    }
  }

  // Array.prototype.sort is stable (spec-guaranteed since ES2019), so
  // equal-score results keep their original catalog order rather than
  // needing an explicit tiebreaker.
  scored.sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.pkg);
}
