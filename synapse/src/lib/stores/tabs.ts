import { writable, derived, get } from "svelte/store";
import { activeFile } from "$lib/stores/vault";

// Ordered list of file paths that are currently "open" as tabs
export const openTabs = writable<string[]>([]);

// Mirrors activeFile so tab bar can highlight the active tab without its own state
export const activeTab = derived(activeFile, ($activeFile) => $activeFile);

/**
 * Open a file as a tab. Adds it to openTabs if not already present,
 * then sets it as the active file. Call this instead of openFile() when
 * you want the tab bar to track the file.
 */
export function addTab(path: string) {
  openTabs.update((tabs) => {
    if (tabs.includes(path)) return tabs;
    return [...tabs, path];
  });
}

/**
 * Close a tab by path. If the closed tab was active, activate the
 * nearest remaining tab (prefer the one to the right, fall back to left).
 * When no tabs remain, clears activeFile.
 */
export function closeTab(path: string, setActive: (p: string | null) => void) {
  const tabs = get(openTabs);
  const idx = tabs.indexOf(path);
  if (idx === -1) return;

  const next = tabs.filter((t) => t !== path);
  openTabs.set(next);

  const currentActive = get(activeFile);
  if (currentActive !== path) return; // closing a background tab — no switch needed

  if (next.length === 0) {
    setActive(null);
    return;
  }

  // Prefer the tab to the right; if we were at the end, take the left neighbour
  const nextIdx = Math.min(idx, next.length - 1);
  setActive(next[nextIdx]);
}
