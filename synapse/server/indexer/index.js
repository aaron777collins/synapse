/**
 * Indexer orchestrator — scans all .md files in the vault and builds:
 *   - forward link map (wikilinks per file)
 *   - backlink map (reverse)
 *   - tag index
 *   - full-text inverted index
 *
 * All indexes are kept in memory and updated incrementally via reindexFile /
 * removeFile. The watcher uses fs.watch with a 100ms debounce to catch
 * external file system changes.
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { parseLinks, buildBacklinks } from "./links.js";
import { parseTags } from "./tags.js";
import { buildFullTextIndex, searchIndex } from "./fulltext.js";

const IGNORED_DIRS = new Set([".git", "node_modules", ".trash"]);

/**
 * Recursively collect all .md file paths under `dir`.
 * Returns absolute paths.
 *
 * @param {string} dir  Absolute path
 * @returns {Promise<string[]>}
 */
async function collectMarkdownFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Convert an absolute vault file path to a vault-relative path with forward
 * slashes (e.g. "notes/Second.md").
 *
 * @param {string} vaultRoot  Absolute path to vault root
 * @param {string} absPath    Absolute path to file
 * @returns {string}
 */
function toRelative(vaultRoot, absPath) {
  return path.relative(vaultRoot, absPath).replace(/\\/g, "/");
}

/**
 * Build the file index: Map<lowercaseName, relativePath[]>
 * The key is the base name without .md extension, lowercased.
 * Multiple files can share the same base name (ambiguous links).
 *
 * @param {string[]} relativePaths
 * @returns {Map<string, string[]>}
 */
function buildFileIndex(relativePaths) {
  const idx = new Map();
  for (const rp of relativePaths) {
    const base = path.basename(rp, ".md").toLowerCase();
    if (!idx.has(base)) idx.set(base, []);
    idx.get(base).push(rp);
  }
  return idx;
}

/**
 * Create and return an indexer bound to a specific vault root.
 *
 * @param {string} vaultRoot  Absolute path to the vault directory
 */
export function createIndexer(vaultRoot) {
  // ── State ────────────────────────────────────────────────────────────────

  /** Map<relativePath, content> */
  const fileContents = new Map();

  /** Map<relativePath, {target, alias, lineNumber}[]> */
  const forwardLinks = new Map();

  /** Map<relativePath, {tag, lineNumber}[]> */
  const fileTags = new Map();

  /** Map<lowercaseName, relativePath[]> */
  let fileIndex = new Map();

  /** Map<word, {path, lineNumber}[]> — rebuilt lazily on search */
  let ftIndex = null;

  /** Watcher handle (fs.FSWatcher) */
  let watcher = null;

  // ── Internal helpers ─────────────────────────────────────────────────────

  function invalidateFtIndex() {
    // Invalidate so the next search rebuilds from current fileContents
    ftIndex = null;
  }

  function ensureFtIndex() {
    if (!ftIndex) {
      ftIndex = buildFullTextIndex(fileContents);
    }
    return ftIndex;
  }

  /**
   * Add or update a single file in all in-memory indexes.
   * Does NOT touch fileIndex — call rebuildFileIndex() after.
   *
   * @param {string} relPath
   * @param {string} content
   */
  function indexOne(relPath, content) {
    fileContents.set(relPath, content);
    forwardLinks.set(relPath, parseLinks(content));
    fileTags.set(relPath, parseTags(content));
    invalidateFtIndex();
  }

  /**
   * Remove a single file from all in-memory indexes.
   * Does NOT touch fileIndex — call rebuildFileIndex() after.
   *
   * @param {string} relPath
   */
  function removeOne(relPath) {
    fileContents.delete(relPath);
    forwardLinks.delete(relPath);
    fileTags.delete(relPath);
    invalidateFtIndex();
  }

  function rebuildFileIndex() {
    fileIndex = buildFileIndex([...fileContents.keys()]);
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Scan the vault and build all indexes from scratch.
   */
  async function buildAll() {
    const absPaths = await collectMarkdownFiles(vaultRoot);

    // Read all files concurrently
    const readResults = await Promise.allSettled(
      absPaths.map(async (abs) => {
        const content = await fsp.readFile(abs, "utf-8");
        return { relPath: toRelative(vaultRoot, abs), content };
      })
    );

    for (const result of readResults) {
      if (result.status === "fulfilled") {
        const { relPath, content } = result.value;
        fileContents.set(relPath, content);
        forwardLinks.set(relPath, parseLinks(content));
        fileTags.set(relPath, parseTags(content));
      }
    }

    rebuildFileIndex();
    invalidateFtIndex();
  }

  /**
   * Update the index for a single file (called after write).
   *
   * @param {string} relPath  Vault-relative path (e.g. "notes/Second.md")
   * @param {string} content
   */
  function reindexFile(relPath, content) {
    indexOne(relPath, content);
    rebuildFileIndex();
  }

  /**
   * Remove a file from the index (called after delete).
   *
   * @param {string} relPath
   */
  function removeFile(relPath) {
    removeOne(relPath);
    rebuildFileIndex();
  }

  /**
   * Return backlinks for a given file path.
   * Accepts both relative vault paths and bare filenames.
   *
   * @param {string} filePath  e.g. "Welcome.md" or "notes/Second.md"
   * @returns {{ source: string, lineNumber: number }[]}
   */
  function getBacklinks(filePath) {
    const backlinks = buildBacklinks(forwardLinks, fileIndex);
    return backlinks.get(filePath) || [];
  }

  /**
   * Return backlinks with a snippet of the source line for context.
   *
   * @param {string} filePath
   * @returns {{ source: string, lineNumber: number, context: string }[]}
   */
  function getBacklinkContext(filePath) {
    const raw = getBacklinks(filePath);
    return raw.map(({ source, lineNumber }) => {
      const content = fileContents.get(source) || "";
      const line = content.split("\n")[lineNumber - 1] || "";
      return { source, lineNumber, context: line.trim() };
    });
  }

  /**
   * Return graph data suitable for D3 force layout.
   * Nodes: all known files. Edges: resolved forward links.
   *
   * @returns {{ nodes: {id: string}[], edges: {source: string, target: string}[] }}
   */
  function getGraph() {
    const nodes = [...fileContents.keys()].map((id) => ({ id }));
    const edges = [];

    for (const [sourcePath, links] of forwardLinks) {
      for (const { target } of links) {
        const targetPath = resolveLink(target, fileIndex);
        if (targetPath) {
          edges.push({ source: sourcePath, target: targetPath });
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Resolve a wikilink target to a file path using the file index.
   * Exposed so getGraph() can use it without importing from links.js again.
   */
  function resolveLink(target, idx) {
    const key = target.replace(/\.md$/i, "").toLowerCase();
    const matches = idx.get(key);
    return matches && matches.length > 0 ? matches[0] : null;
  }

  /**
   * Return all tags across the vault as { tag, count, files[] }.
   *
   * @returns {{ tag: string, count: number, files: string[] }[]}
   */
  function getTags() {
    // Aggregate tag → files
    const tagMap = new Map(); // tag → Set<filePath>

    for (const [filePath, tags] of fileTags) {
      for (const { tag } of tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, new Set());
        tagMap.get(tag).add(filePath);
      }
    }

    return [...tagMap.entries()]
      .map(([tag, fileSet]) => ({
        tag,
        count: fileSet.size,
        files: [...fileSet].sort(),
      }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }

  /**
   * Return all files that have a given tag, with the line number where the tag
   * appears so callers can jump directly to it.
   *
   * Previously returned plain strings; now returns { path, lineNumber } to
   * match the TagFile interface the frontend expects.
   *
   * @param {string} tag
   * @returns {{ path: string, lineNumber: number }[]}
   */
  function getTagFiles(tag) {
    const result = [];
    for (const [filePath, tags] of fileTags) {
      const match = tags.find((t) => t.tag === tag);
      if (match) {
        result.push({ path: filePath, lineNumber: match.lineNumber });
      }
    }
    return result.sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Full-text search across all indexed files.
   *
   * @param {string} query
   * @returns {{ path: string, matches: { content: string, lineNumber: number }[] }[]}
   */
  function search(query) {
    const idx = ensureFtIndex();
    return searchIndex(idx, query, fileContents);
  }

  /**
   * Expose the raw file index (for external resolvers / tests).
   *
   * @returns {Map<string, string[]>}
   */
  function getFileIndex() {
    return fileIndex;
  }

  /**
   * Start watching the vault for external file system changes.
   * Uses a 100ms debounce per path to avoid double-firing on rapid saves.
   */
  function startWatcher() {
    if (watcher) return; // already watching

    const debounceMap = new Map(); // absPath → timer

    try {
      watcher = fs.watch(vaultRoot, { recursive: true }, (event, filename) => {
        if (!filename || !filename.endsWith(".md")) return;

        const absPath = path.join(vaultRoot, filename);
        const relPath = filename.replace(/\\/g, "/");

        // Clear any pending debounce for this path
        if (debounceMap.has(absPath)) {
          clearTimeout(debounceMap.get(absPath));
        }

        const timer = setTimeout(async () => {
          debounceMap.delete(absPath);
          try {
            const content = await fsp.readFile(absPath, "utf-8");
            reindexFile(relPath, content);
          } catch (err) {
            // File was deleted or is unreadable — remove from index
            if (err.code === "ENOENT") {
              removeFile(relPath);
            }
            // Other errors (permissions, etc.) are silent — the old index stays valid
          }
        }, 100);

        debounceMap.set(absPath, timer);
      });
    } catch (err) {
      // fs.watch with recursive option may not be supported on all platforms.
      // Log a warning but don't crash — the indexer still works without watching.
      console.warn(`[indexer] fs.watch not available: ${err.message}`);
    }
  }

  return {
    buildAll,
    reindexFile,
    removeFile,
    getBacklinks,
    getBacklinkContext,
    getGraph,
    getTags,
    getTagFiles,
    search,
    getFileIndex,
    startWatcher,
  };
}
