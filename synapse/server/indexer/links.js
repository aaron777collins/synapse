/**
 * Wikilink parsing and backlink resolution for Obsidian-style [[links]].
 *
 * Obsidian supports three link forms:
 *   [[Target]]          — basic link
 *   [[Target|Alias]]    — display alias
 *   [[Target#Section]]  — section anchor (section is stripped; only the file target matters)
 */

/**
 * Strip code fences and inline code from a line so we don't extract links
 * from within them. Returns a version of the line safe for link scanning.
 *
 * We process the full document in one pass to correctly handle multi-line
 * fenced blocks.
 *
 * @param {string} content
 * @returns {{ safeContent: string, lineOffsets: number[] }}
 */
function buildSafeContent(content) {
  // Replace code-fence blocks entirely with whitespace to preserve line numbers.
  // Using a simple state machine instead of regex to handle nested/adjacent fences correctly.
  const lines = content.split("\n");
  const result = [];
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trimStart())) {
      inFence = !inFence;
      // Replace the fence marker line with blank to preserve line count
      result.push(" ".repeat(line.length));
    } else if (inFence) {
      result.push(" ".repeat(line.length));
    } else {
      // Strip inline code spans (`...`) by replacing their contents with spaces.
      // We leave the backticks so we don't shift character positions.
      result.push(line.replace(/`[^`]*`/g, (m) => "`" + " ".repeat(m.length - 2) + "`"));
    }
  }

  return result.join("\n");
}

/**
 * Parse [[wikilinks]] from markdown content.
 *
 * @param {string} content
 * @returns {{ target: string, alias: string|null, lineNumber: number }[]}
 */
export function parseLinks(content) {
  const safe = buildSafeContent(content);
  const lines = safe.split("\n");
  const links = [];

  // Matches [[target]], [[target|alias]], [[target#section]], [[target#section|alias]]
  const wikilinkRe = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    let match;
    wikilinkRe.lastIndex = 0;
    while ((match = wikilinkRe.exec(lines[i])) !== null) {
      const target = match[1].trim();
      const alias = match[2] !== undefined ? match[2].trim() : null;
      if (target) {
        links.push({ target, alias, lineNumber });
      }
    }
  }

  return links;
}

/**
 * Case-insensitive filename lookup in the file index.
 * The fileIndex maps lowercased base name (without .md) to an array of paths.
 *
 * Returns the first matching path, or null if not found.
 *
 * @param {string} target
 * @param {Map<string, string[]>} fileIndex
 * @returns {string|null}
 */
export function resolveLink(target, fileIndex) {
  // Strip .md extension if caller passed it
  const key = target.replace(/\.md$/i, "").toLowerCase();
  const matches = fileIndex.get(key);
  return matches && matches.length > 0 ? matches[0] : null;
}

/**
 * Build a reverse (backlink) map from the forward link map.
 *
 * forwardLinks: Map<filePath, {target, alias, lineNumber}[]>
 * fileIndex:    Map<lowercaseName, filePath[]>
 *
 * Returns Map<targetPath, {source: string, lineNumber: number}[]>
 *
 * @param {Map<string, {target: string, alias: string|null, lineNumber: number}[]>} forwardLinks
 * @param {Map<string, string[]>} fileIndex
 * @returns {Map<string, {source: string, lineNumber: number}[]>}
 */
export function buildBacklinks(forwardLinks, fileIndex) {
  const backlinks = new Map();

  for (const [sourcePath, links] of forwardLinks) {
    for (const { target, lineNumber } of links) {
      const targetPath = resolveLink(target, fileIndex);
      if (!targetPath) continue; // unresolved link — skip

      if (!backlinks.has(targetPath)) {
        backlinks.set(targetPath, []);
      }
      backlinks.get(targetPath).push({ source: sourcePath, lineNumber });
    }
  }

  return backlinks;
}
