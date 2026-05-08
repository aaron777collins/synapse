// Virtual paths are non-filesystem paths that route to synthetic views.
// This module is intentionally a standalone utility — keeping it free of
// store imports prevents circular dependency cycles when stores import it.

export const TAG_NOTE_PREFIX = "@tag/";

export function isTagNotePath(path: string): boolean {
  return path.startsWith(TAG_NOTE_PREFIX);
}

export function tagFromPath(path: string): string {
  return path.slice(TAG_NOTE_PREFIX.length);
}
