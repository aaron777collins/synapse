import { get } from "svelte/store";
import { activeFile } from "$lib/stores/vault";
import { editorMode } from "$lib/stores/editor";
import { isTagNotePath, tagFromPath } from "$lib/utils/virtualPaths";

let handlingPopstate = false;
let initialized = false;

function buildUrl(file: string | null, mode: string): string {
  const params = new URLSearchParams();
  if (file) params.set("file", file);
  if (mode !== "edit") params.set("mode", mode);
  const qs = params.toString();
  return qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
}

function syncUrl(file: string | null, mode: string, push: boolean) {
  if (handlingPopstate || !initialized) return;

  const current = window.history.state;
  if (current?.file === file && current?.mode === mode) return;

  const stateObj = { file, mode };
  const url = buildUrl(file, mode);

  if (push) {
    window.history.pushState(stateObj, "", url);
  } else {
    window.history.replaceState(stateObj, "", url);
  }
}

async function navigateToState(file: string | null, mode: string) {
  const currentFile = get(activeFile);
  const currentMode = get(editorMode);

  if (file !== currentFile) {
    if (!file) {
      activeFile.set(null);
    } else if (isTagNotePath(file)) {
      const { openTagNote } = await import("$lib/stores/tagNote");
      await openTagNote(tagFromPath(file));
    } else {
      const { openFile } = await import("$lib/stores/vault");
      await openFile(file);
    }
  }

  if (mode !== currentMode && (mode === "edit" || mode === "preview")) {
    editorMode.set(mode);
  }
}

export async function initFromUrl() {
  if (initialized) return;

  const params = new URLSearchParams(window.location.search);
  const file = params.get("file");
  const mode = params.get("mode") || "edit";

  // Establish initial history entry
  window.history.replaceState(
    { file: file || null, mode },
    "",
    window.location.href
  );

  // Restore state from URL
  if (file) {
    try {
      await navigateToState(file, mode);
    } catch {
      // File not found or API error — stay on empty state
    }
  }
  if (mode === "preview") {
    editorMode.set("preview");
  }

  // Listen for browser back/forward
  window.addEventListener("popstate", (event) => {
    handlingPopstate = true;
    const state = event.state || {};
    const file = state.file ?? null;
    const mode = state.mode ?? "edit";

    navigateToState(file, mode).finally(() => {
      handlingPopstate = false;
    });
  });

  // Subscribe to store changes — push URL updates reactively
  let lastFile = get(activeFile);

  activeFile.subscribe((file) => {
    if (!initialized) return;
    const fileChanged = file !== lastFile;
    lastFile = file;
    // File changes push a new history entry
    if (fileChanged) {
      syncUrl(file, get(editorMode), true);
    }
  });

  editorMode.subscribe((mode) => {
    if (!initialized) return;
    // Mode-only changes replace (don't pollute history)
    syncUrl(get(activeFile), mode, false);
  });

  initialized = true;
}
