import { writable } from "svelte/store";
import { api, type TagEntry, type TagFile } from "$lib/services/api";

export const allTags = writable<TagEntry[]>([]);
export const activeTag = writable<string | null>(null);
export const activeTagFiles = writable<TagFile[]>([]);

export async function loadTags() {
  const tags = await api.tags.list();
  allTags.set(tags);
}

export async function selectTag(tag: string) {
  activeTag.set(tag);
  const files = await api.tags.files(tag);
  // Deduplicate by path — getTagFiles returns one entry per occurrence
  const seen = new Set<string>();
  const unique = files.filter((f) => {
    if (seen.has(f.path)) return false;
    seen.add(f.path);
    return true;
  });
  activeTagFiles.set(unique);
}

export function clearTag() {
  activeTag.set(null);
  activeTagFiles.set([]);
}
