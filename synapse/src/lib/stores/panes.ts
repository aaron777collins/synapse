import { writable, derived, get } from "svelte/store";
import { api } from "$lib/services/api";
import { isTagNotePath, tagFromPath } from "$lib/utils/virtualPaths";

export interface PaneState {
  id: string;
  file: string | null;
  content: string;
  mode: "edit" | "preview";
  tabs: string[];
  dirty: boolean;
  saveStatus: "saved" | "saving" | "unsaved" | "error";
  cursorLine: number;
  cursorCol: number;
}

function createPane(id: string): PaneState {
  return {
    id,
    file: null,
    content: "",
    mode: "edit",
    tabs: [],
    dirty: false,
    saveStatus: "saved",
    cursorLine: 1,
    cursorCol: 1,
  };
}

export const panes = writable<PaneState[]>([createPane("pane-1")]);
export const focusedPaneId = writable("pane-1");
export const splitRatio = writable(0.5);
export const isSplit = derived(panes, ($p) => $p.length > 1);

export const focusedPane = derived(
  [panes, focusedPaneId],
  ([$panes, $id]) => $panes.find((p) => p.id === $id) ?? $panes[0]
);

function updatePane(id: string, updater: (p: PaneState) => PaneState) {
  panes.update((all) => all.map((p) => (p.id === id ? updater(p) : p)));
}

export function setFocus(id: string) {
  focusedPaneId.set(id);
}

export function getPaneState(id: string): PaneState {
  return get(panes).find((p) => p.id === id) ?? get(panes)[0];
}

export async function openFileInPane(paneId: string, path: string) {
  if (isTagNotePath(path)) {
    const { openTagNote } = await import("$lib/stores/tagNote");
    const tag = tagFromPath(path);
    const virtualPath = `@tag/${tag}`;
    const data = await api.tags.note(tag);
    updatePane(paneId, (p) => ({
      ...p,
      file: virtualPath,
      content: "",
      dirty: false,
      saveStatus: "saved",
      tabs: p.tabs.includes(virtualPath) ? p.tabs : [...p.tabs, virtualPath],
    }));
    // Tag note data is global — set it so TagNoteView can read it
    const { tagNoteData } = await import("$lib/stores/tagNote");
    tagNoteData.set(data);
    return;
  }

  const { content } = await api.files.read(path);
  updatePane(paneId, (p) => ({
    ...p,
    file: path,
    content,
    dirty: false,
    saveStatus: "saved",
    tabs: p.tabs.includes(path) ? p.tabs : [...p.tabs, path],
  }));
}

export async function savePaneFile(paneId: string) {
  const pane = getPaneState(paneId);
  if (!pane.file || isTagNotePath(pane.file)) return;

  updatePane(paneId, (p) => ({ ...p, saveStatus: "saving" }));
  try {
    await api.files.write(pane.file, pane.content);
    updatePane(paneId, (p) => ({ ...p, dirty: false, saveStatus: "saved" }));
  } catch {
    updatePane(paneId, (p) => ({ ...p, saveStatus: "error" }));
  }
}

export function setPaneContent(paneId: string, content: string) {
  updatePane(paneId, (p) => ({
    ...p,
    content,
    dirty: true,
    saveStatus: "unsaved",
  }));
}

export function setPaneMode(paneId: string, mode: "edit" | "preview") {
  updatePane(paneId, (p) => ({ ...p, mode }));
}

export function setPaneCursor(paneId: string, line: number, col: number) {
  updatePane(paneId, (p) => ({ ...p, cursorLine: line, cursorCol: col }));
}

export function addTabToPane(paneId: string, path: string) {
  updatePane(paneId, (p) => ({
    ...p,
    tabs: p.tabs.includes(path) ? p.tabs : [...p.tabs, path],
  }));
}

export function closeTabInPane(paneId: string, path: string) {
  const pane = getPaneState(paneId);
  const idx = pane.tabs.indexOf(path);
  if (idx === -1) return;

  const next = pane.tabs.filter((t) => t !== path);
  const isActive = pane.file === path;

  if (!isActive) {
    updatePane(paneId, (p) => ({ ...p, tabs: next }));
    return;
  }

  if (next.length === 0) {
    const current = get(panes);
    if (current.length > 1) {
      closePane(paneId);
    } else {
      updatePane(paneId, (p) => ({ ...p, tabs: [], file: null, content: "" }));
    }
    return;
  }

  const nextIdx = Math.min(idx, next.length - 1);
  const nextFile = next[nextIdx];
  updatePane(paneId, (p) => ({ ...p, tabs: next }));
  openFileInPane(paneId, nextFile);
}

export function splitWithFile(targetPaneId: string, filePath: string, side: "left" | "right") {
  const current = get(panes);
  if (current.length >= 2) return;

  const newPane = createPane("pane-2");
  if (side === "right") {
    panes.set([...current, newPane]);
  } else {
    panes.set([newPane, ...current]);
  }
  openFileInPane("pane-2", filePath);
  focusedPaneId.set("pane-2");
}

export function closePane(paneId: string) {
  const current = get(panes);
  if (current.length <= 1) return;

  const remaining = current.filter((p) => p.id !== paneId);
  panes.set(remaining);
  focusedPaneId.set(remaining[0].id);
  splitRatio.set(0.5);
}

export function reorderTabs(paneId: string, fromIndex: number, toIndex: number) {
  updatePane(paneId, (p) => {
    const tabs = [...p.tabs];
    const [moved] = tabs.splice(fromIndex, 1);
    tabs.splice(toIndex, 0, moved);
    return { ...p, tabs };
  });
}

export function renameTabInAllPanes(oldPath: string, newPath: string) {
  panes.update((all) =>
    all.map((p) => ({
      ...p,
      file: p.file === oldPath ? newPath : p.file,
      tabs: p.tabs.map((t) => (t === oldPath ? newPath : t)),
    }))
  );
}

export function moveTabToOtherPane(sourcePaneId: string, filePath: string) {
  const current = get(panes);
  if (current.length < 2) return;

  const target = current.find((p) => p.id !== sourcePaneId);
  if (!target) return;

  // Remove tab from source
  closeTabInPane(sourcePaneId, filePath);

  // Open in target
  openFileInPane(target.id, filePath);
  focusedPaneId.set(target.id);
}
