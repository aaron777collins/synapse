import { writable } from "svelte/store";
export const editorMode = writable<"edit" | "preview">("edit");
export const cursorLine = writable(1);
export const cursorCol = writable(1);
