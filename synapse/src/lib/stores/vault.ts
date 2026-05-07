import { writable, get } from "svelte/store";
import { api, type FileEntry } from "$lib/services/api";

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
  const { content } = await api.files.read(path);
  activeFile.set(path);
  activeContent.set(content);
  dirty.set(false);
  saveStatus.set("saved");
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
