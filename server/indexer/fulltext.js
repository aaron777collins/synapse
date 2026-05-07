/**
 * Inverted full-text index over vault markdown files.
 *
 * Strategy:
 *   - tokenize() produces normalized terms (lowercase, alpha-only, no stop words, min length 3)
 *   - buildFullTextIndex() builds Map<word, [{path, lineNumber}]>
 *   - searchIndex() multi-word AND semantics: files must match all query terms,
 *     ranked descending by total hit count across all terms.
 */

// Common English stop words that add noise without meaning in search
const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can",
  "her", "was", "one", "our", "out", "had", "him", "his", "how",
  "its", "may", "now", "own", "she", "too", "use", "was", "who",
  "why", "yet", "any", "has", "via", "etc", "per",
]);

/**
 * Tokenize text into searchable terms.
 * - Lowercases everything
 * - Splits on any non-alphanumeric character
 * - Drops tokens shorter than 3 characters
 * - Drops stop words
 *
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

/**
 * Build an inverted index from a map of file paths to their content.
 *
 * @param {Map<string, string>} files  Map<path, content>
 * @returns {Map<string, {path: string, lineNumber: number}[]>}
 */
export function buildFullTextIndex(files) {
  const index = new Map();

  for (const [filePath, content] of files) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const tokens = tokenize(lines[i]);
      for (const token of tokens) {
        if (!index.has(token)) {
          index.set(token, []);
        }
        index.get(token).push({ path: filePath, lineNumber });
      }
    }
  }

  return index;
}

/**
 * Search the inverted index for a query string.
 *
 * Each word in the query is looked up; results are files that contain ALL
 * query terms (AND semantics). Files are ranked by total hit count descending.
 *
 * @param {Map<string, {path: string, lineNumber: number}[]>} index
 * @param {string} query
 * @param {Map<string, string>} files  Map<path, content> for context snippets
 * @returns {{ path: string, matches: { content: string, lineNumber: number }[] }[]}
 */
export function searchIndex(index, query, files) {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  // Gather hit sets per term: Map<path, Set<lineNumber>>
  const termHits = queryTerms.map((term) => {
    const entries = index.get(term) || [];
    const pathMap = new Map();
    for (const { path, lineNumber } of entries) {
      if (!pathMap.has(path)) pathMap.set(path, new Set());
      pathMap.get(path).add(lineNumber);
    }
    return pathMap;
  });

  // AND: only paths that appear in every term's hit set
  const [first, ...rest] = termHits;
  const candidatePaths = [...first.keys()].filter((p) => rest.every((m) => m.has(p)));

  if (candidatePaths.length === 0) return [];

  // Collect all matched line numbers per file across all terms
  const results = candidatePaths.map((filePath) => {
    const matchedLines = new Set();
    for (const termMap of termHits) {
      const lines = termMap.get(filePath) || new Set();
      for (const ln of lines) matchedLines.add(ln);
    }

    // Build context snippets from the original file content
    const fileLines = (files.get(filePath) || "").split("\n");
    const matches = [...matchedLines]
      .sort((a, b) => a - b)
      .map((lineNumber) => ({
        content: fileLines[lineNumber - 1] ?? "",
        lineNumber,
      }));

    return { path: filePath, matches, _hitCount: matchedLines.size };
  });

  // Rank by total hit count descending
  results.sort((a, b) => b._hitCount - a._hitCount);

  // Strip internal ranking field before returning
  return results.map(({ path, matches }) => ({ path, matches }));
}
