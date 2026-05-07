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
  activeTagFiles.set(files);
}

export function clearTag() {
  activeTag.set(null);
  activeTagFiles.set([]);
}
