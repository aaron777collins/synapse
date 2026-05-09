import { writable, get } from "svelte/store";
import { api, type FileEntry } from "$lib/services/api";
import { isTagNotePath, tagFromPath } from "$lib/utils/virtualPaths";

export const activeFile = writable<string | null>(null);
export const activeContent = writable<string>("");
export const dirty = writable(false);
export const saveStatus = writable<"saved" | "saving" | "unsaved" | "error">("saved");
export const expandedDirs = writable<Set<string>>(new Set());
export const childrenByDir = writable<Map<string, FileEntry[]>>(new Map());
export const allFiles = writable<string[]>([]);
export const recentFiles = writable<string[]>([]);

export async function loadDir(dir: string) {
  const entries = await api.files.list(dir);
  childrenByDir.update((m) => { m.set(dir, entries); return new Map(m); });
  const files: string[] = [];
  for (const entry of entries) { if (entry.type === "file") files.push(entry.path); }
  allFiles.update((existing) => { const set = new Set(existing); for (const f of files) set.add(f); return [...set]; });
  return entries;
}

export async function openFile(path: string) {
  // Route through the panes store so the focused pane gets updated
  const { openFileInPane, focusedPaneId } = await import("$lib/stores/panes");
  await openFileInPane(get(focusedPaneId), path);
  recentFiles.update((recent) => {
    const filtered = recent.filter((f) => f !== path);
    return [path, ...filtered].slice(0, 20);
  });
}

export async function saveFile() {
  const path = get(activeFile);
  const content = get(activeContent);
  if (!path) return;
  saveStatus.set("saving");
  try {
    await api.files.write(path, content);
    dirty.set(false);
    saveStatus.set("saved");
  } catch {
    saveStatus.set("error");
  }
}

export async function createFile(path: string, content = "") {
  await api.files.write(path, content);
  const dir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
  await loadDir(dir);
  await openFile(path);
}

export async function createDir(path: string) {
  await api.files.mkdir(path);
  const parentDir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
  await loadDir(parentDir);
}

export async function deleteFileAction(path: string) {
  await api.files.delete(path);
  const dir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
  await loadDir(dir);
  if (get(activeFile) === path) { activeFile.set(null); activeContent.set(""); }
}

export async function navigateToLink(target: string) {
  const files = get(allFiles);
  const targetLower = target.toLowerCase().replace(/\.md$/i, "");
  const match = files.find((f) => {
    const name = f.replace(/\.md$/i, "").toLowerCase();
    const baseName = name.includes("/") ? name.substring(name.lastIndexOf("/") + 1) : name;
    return baseName === targetLower || name === targetLower;
  });
  if (match) { await openFile(match); }
  else { const path = `${target}.md`; await createFile(path, `# ${target}\n\n`); }
}

export async function moveFileAction(from: string, to: string) {
  await api.files.move(from, to);
  const fromDir = from.includes("/") ? from.substring(0, from.lastIndexOf("/")) : "";
  const toDir = to.includes("/") ? to.substring(0, to.lastIndexOf("/")) : "";
  await loadDir(fromDir);
  if (fromDir !== toDir) await loadDir(toDir);
  allFiles.update((files) =>
    files.map((f) => {
      if (f === from) return to;
      if (f.startsWith(from + "/")) return to + f.substring(from.length);
      return f;
    })
  );
  const { renameTabInAllPanes } = await import("$lib/stores/panes");
  renameTabInAllPanes(from, to);
  if (get(activeFile) === from) activeFile.set(to);
}

export async function loadAllFiles(dir = ""): Promise<void> {
  const entries = await api.files.list(dir);
  childrenByDir.update((m) => { m.set(dir, entries); return new Map(m); });
  for (const entry of entries) {
    if (entry.type === "file") {
      allFiles.update((existing) => { const set = new Set(existing); set.add(entry.path); return [...set]; });
    } else if (entry.type === "dir") {
      await loadAllFiles(entry.path);
    }
  }
}
