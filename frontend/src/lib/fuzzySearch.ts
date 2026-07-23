export type SearchFields = {
  tags?: readonly string[];
  name?: string;
  extras?: readonly string[];
};

export type SearchMatch = {
  matches: boolean;
  score: number;
  matchedViaTags: boolean;
};

const TAG_MATCH_SCORE = 100;
const TAG_SUBSTRING_BONUS = 10;
const NAME_MATCH_SCORE = 10;
const NAME_SUBSTRING_BONUS = 5;
const EXTRA_MATCH_SCORE = 1;

const normalize = (value: string): string => value.trim().toLowerCase();

const tokenize = (query: string): string[] =>
  normalize(query)
    .split(/\s+/)
    .filter(Boolean);

export const fuzzyIncludes = (text: string, query: string): boolean => {
  const haystack = normalize(text);
  const needle = normalize(query);
  if (!needle) return true;
  if (haystack.includes(needle)) return true;

  let needleIndex = 0;
  for (let i = 0; i < haystack.length && needleIndex < needle.length; i += 1) {
    if (haystack[i] === needle[needleIndex]) needleIndex += 1;
  }
  return needleIndex === needle.length;
};

const scoreTokenAgainstValues = (
  token: string,
  values: readonly string[],
  baseScore: number,
  substringBonus: number,
): number | null => {
  let bestScore: number | null = null;

  for (const value of values) {
    if (!fuzzyIncludes(value, token)) continue;

    const score = baseScore + (normalize(value).includes(token) ? substringBonus : 0);
    bestScore = bestScore == null ? score : Math.max(bestScore, score);
  }

  return bestScore;
};

export const scoreFuzzySearch = (fields: SearchFields, rawQuery: string): SearchMatch => {
  const tokens = tokenize(rawQuery);
  if (!tokens.length) {
    return { matches: true, score: 0, matchedViaTags: false };
  }

  const tags = (fields.tags ?? []).map((tag) => normalize(tag));
  const name = normalize(fields.name ?? "");
  const extras = (fields.extras ?? []).map((value) => normalize(value));

  let score = 0;
  let matchedViaTags = false;

  for (const token of tokens) {
    const tagScore = scoreTokenAgainstValues(token, tags, TAG_MATCH_SCORE, TAG_SUBSTRING_BONUS);
    if (tagScore != null) {
      matchedViaTags = true;
      score += tagScore;
      continue;
    }

    const nameScore = scoreTokenAgainstValues(token, [name], NAME_MATCH_SCORE, NAME_SUBSTRING_BONUS);
    if (nameScore != null) {
      score += nameScore;
      continue;
    }

    const extraScore = scoreTokenAgainstValues(token, extras, EXTRA_MATCH_SCORE, 0);
    if (extraScore != null) {
      score += extraScore;
      continue;
    }

    return { matches: false, score: 0, matchedViaTags: false };
  }

  return { matches: true, score, matchedViaTags };
};

export const matchesFuzzySearch = (fields: SearchFields, query: string): boolean =>
  scoreFuzzySearch(fields, query).matches;