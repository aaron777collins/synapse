import { writable } from "svelte/store";
import { api, type SearchResult } from "$lib/services/api";

export const searchQuery = writable("");
export const searchResults = writable<SearchResult[]>([]);
export const searchActive = writable(false);

export async function performSearch(query: string) {
  if (!query.trim()) { searchResults.set([]); searchActive.set(false); return; }
  searchActive.set(true);
  const results = await api.search(query);
  searchResults.set(results);
}
