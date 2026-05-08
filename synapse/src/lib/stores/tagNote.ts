import { writable, get } from "svelte/store";
import { api, type TagNoteData } from "$lib/services/api";
import { activeFile, activeContent } from "$lib/stores/vault";
import { addTab } from "$lib/stores/tabs";
import { TAG_NOTE_PREFIX, isTagNotePath, tagFromPath } from "$lib/utils/virtualPaths";

// Re-export so callers can import path utilities from one place
export { TAG_NOTE_PREFIX, isTagNotePath, tagFromPath };

export const tagNoteData = writable<TagNoteData | null>(null);
export const tagNoteLoading = writable(false);
export const tagNoteError = writable<string | null>(null);

export async function openTagNote(tag: string) {
  const virtualPath = `${TAG_NOTE_PREFIX}${tag}`;
  tagNoteLoading.set(true);
  tagNoteError.set(null);

  try {
    const data = await api.tags.note(tag);
    tagNoteData.set(data);
    activeFile.set(virtualPath);
    // Virtual notes have no editable body — clear any stale editor content
    activeContent.set("");
    addTab(virtualPath);
  } catch (e) {
    tagNoteError.set(e instanceof Error ? e.message : "Failed to load tag note");
  } finally {
    tagNoteLoading.set(false);
  }
}

/**
 * Re-fetches data for whichever tag note is currently active.
 * No-ops if the active file is not a tag note virtual path.
 */
export async function refreshTagNote() {
  const file = get(activeFile);
  if (!file || !isTagNotePath(file)) return;
  const tag = tagFromPath(file);
  await openTagNote(tag);
}
