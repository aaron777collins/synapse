/**
 * Tag parsing for Obsidian-style #tags.
 *
 * Handles:
 *   - Inline tags:         #tag  #tag/subtag
 *   - YAML frontmatter:    tags: [a, b]  OR  tags:\n  - a\n  - b
 *
 * Skips:
 *   - Code fences (``` blocks)
 *   - Inline code (` ... `)
 *   - Heading lines (# Heading — a # at the very start of a line)
 */

/**
 * Extract frontmatter block (between leading ---) and return it with the
 * line number at which the frontmatter block begins (1-based).
 *
 * Returns null when no frontmatter is present.
 *
 * @param {string[]} lines
 * @returns {{ fmLines: string[], startLine: number } | null}
 */
function extractFrontmatter(lines) {
  if (lines[0] !== "---") return null;
  const end = lines.indexOf("---", 1);
  if (end === -1) return null;
  // Lines between the two --- markers (not including the markers themselves)
  return { fmLines: lines.slice(1, end), startLine: 2 }; // startLine is 1-based line of first fm content
}

/**
 * Parse tags from YAML frontmatter lines.
 * Supports:
 *   tags: [a, b, c]
 *   tags:
 *     - a
 *     - b
 *
 * @param {string[]} fmLines  Lines inside the frontmatter block
 * @param {number} startLine  1-based line number of fmLines[0] in the document
 * @returns {{ tag: string, lineNumber: number }[]}
 */
function parseFrontmatterTags(fmLines, startLine) {
  const tags = [];
  let i = 0;

  while (i < fmLines.length) {
    const line = fmLines[i];
    const lineNumber = startLine + i;

    // Inline array:  tags: [a, b, c]
    const inlineMatch = line.match(/^tags:\s*\[([^\]]*)\]/i);
    if (inlineMatch) {
      const items = inlineMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
      for (const item of items) {
        tags.push({ tag: item, lineNumber });
      }
      i++;
      continue;
    }

    // List format:  tags:\n  - a\n  - b
    const listKeyMatch = line.match(/^tags:\s*$/i);
    if (listKeyMatch) {
      i++;
      while (i < fmLines.length) {
        const listLine = fmLines[i];
        const itemMatch = listLine.match(/^\s*-\s+(.+)/);
        if (!itemMatch) break; // no longer in the list
        tags.push({ tag: itemMatch[1].trim(), lineNumber: startLine + i });
        i++;
      }
      continue;
    }

    i++;
  }

  return tags;
}

/**
 * Parse #tags from markdown content.
 *
 * @param {string} content
 * @returns {{ tag: string, lineNumber: number }[]}
 */
export function parseTags(content) {
  const lines = content.split("\n");
  const tags = [];

  // Handle YAML frontmatter first — these tags don't follow inline rules
  const fm = extractFrontmatter(lines);
  const fmEndLine = fm ? fm.startLine + fm.fmLines.length : -1; // exclusive, 1-based
  if (fm) {
    tags.push(...parseFrontmatterTags(fm.fmLines, fm.startLine));
  }

  // Determine the first content line after frontmatter (1-based)
  // fmEndLine is the line number of the closing ---, so content starts after that
  const contentStartLine = fm ? fmEndLine + 1 : 1;

  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1; // 1-based

    // Skip frontmatter block entirely (already parsed above)
    if (lineNumber < contentStartLine) continue;

    const raw = lines[i];

    // Track code fence state
    if (/^```/.test(raw.trimStart())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Skip heading lines: a lone # (or ##, etc.) at the start means this is a heading, not a tag
    if (/^#{1,6}\s/.test(raw)) continue;

    // Strip inline code spans before scanning for tags
    const safe = raw.replace(/`[^`]*`/g, (m) => " ".repeat(m.length));

    // A valid tag starts with # followed by at least one word character.
    // tag/subtag form: word chars and slashes are allowed in the tag body.
    // A # preceded by a word character is not a tag (e.g. mid-word #).
    const tagRe = /(?<![a-zA-Z0-9_])#([a-zA-Z_][a-zA-Z0-9_/\-]*)/g;
    let match;
    while ((match = tagRe.exec(safe)) !== null) {
      tags.push({ tag: match[1], lineNumber });
    }
  }

  return tags;
}
