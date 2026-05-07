import path from "node:path";

export function normalizePath(p) {
  return p.replace(/\\/g, "/").replace(/\0/g, "").replace(/^\/+/, "");
}

export function isInsideVault(vaultRoot, relativePath) {
  const normalized = normalizePath(relativePath);
  const resolved = path.resolve(vaultRoot, normalized);
  return resolved === vaultRoot || resolved.startsWith(vaultRoot + path.sep);
}

export function resolveSafe(vaultRoot, relativePath) {
  const normalized = normalizePath(relativePath);
  const resolved = path.resolve(vaultRoot, normalized);
  if (!resolved.startsWith(vaultRoot + path.sep) && resolved !== vaultRoot) {
    throw Object.assign(new Error("Path outside vault"), { statusCode: 403 });
  }
  return resolved;
}
