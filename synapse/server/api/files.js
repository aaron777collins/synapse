import fs from "node:fs/promises";
import path from "node:path";
import { resolveSafe, normalizePath } from "../utils/paths.js";

const IGNORED = new Set([".git", "node_modules", ".trash", ".DS_Store"]);

export async function listDir(vaultRoot, dirPath) {
  const resolved = resolveSafe(vaultRoot, dirPath || "");
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (IGNORED.has(entry.name) || entry.name.startsWith(".")) continue;
    const fullPath = path.join(resolved, entry.name);
    const relativePath = normalizePath(
      path.relative(vaultRoot, fullPath)
    );
    let type = entry.isDirectory() ? "dir" : "file";
    if (entry.isSymbolicLink()) {
      try {
        const stat = await fs.stat(fullPath);
        type = stat.isDirectory() ? "dir" : "file";
      } catch {
        continue;
      }
    }
    results.push({
      name: entry.name,
      path: relativePath,
      type,
    });
  }

  results.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  return results;
}

export async function readFile(vaultRoot, filePath) {
  const resolved = resolveSafe(vaultRoot, filePath);
  const content = await fs.readFile(resolved, "utf-8");
  const stat = await fs.stat(resolved);
  return { content, modified: stat.mtimeMs };
}

export async function writeFile(vaultRoot, filePath, content) {
  const resolved = resolveSafe(vaultRoot, filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, "utf-8");
}

export async function mkDir(vaultRoot, dirPath) {
  const resolved = resolveSafe(vaultRoot, dirPath);
  await fs.mkdir(resolved, { recursive: true });
}

export async function moveFile(vaultRoot, fromPath, toPath) {
  const resolvedFrom = resolveSafe(vaultRoot, fromPath);
  const resolvedTo = resolveSafe(vaultRoot, toPath);
  await fs.mkdir(path.dirname(resolvedTo), { recursive: true });
  await fs.rename(resolvedFrom, resolvedTo);
}

export async function deleteFile(vaultRoot, filePath) {
  const resolved = resolveSafe(vaultRoot, filePath);
  await fs.unlink(resolved);
}
