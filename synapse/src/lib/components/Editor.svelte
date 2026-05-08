<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, lineNumbers, highlightActiveLine } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { activeFile, activeContent, dirty, saveStatus, saveFile, allFiles, navigateToLink, loadAllFiles } from "$lib/stores/vault";
  import { editorMode, cursorLine, cursorCol } from "$lib/stores/editor";
  import { synapseThemeDark } from "$lib/editor/theme";
  import MarkdownPreview from "./MarkdownPreview.svelte";
  import { createMarkdownExtensions } from "$lib/editor/markdown";
  import { createKeymapExtensions } from "$lib/editor/keymaps";
  import { wikilinkAutocomplete, wikilinkDecorations, wikilinkStyles, wikilinkClickHandler } from "$lib/editor/wikilink";
  import { tagDecorations, tagStyles, tagClickHandler } from "$lib/editor/tags";
  import { openTagNote } from "$lib/stores/tagNote";
  import { debounce } from "$lib/utils/debounce";
  import { get } from "svelte/store";

  let editorContainer: HTMLDivElement = $state()!;
  let view: EditorView | null = $state(null);

  // Debounced auto-save — fires 1200ms after the last keystroke
  const debouncedSave = debounce(() => {
    saveFile();
  }, 1200);

  function buildView(content: string) {
    if (view) {
      view.destroy();
      view = null;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const text = update.state.doc.toString();
        activeContent.set(text);
        dirty.set(true);
        saveStatus.set("unsaved");
        // Schedule auto-save; Mod-s from keymaps will also call saveFile directly
        debouncedSave();
      }

      if (update.selectionSet) {
        const sel = update.state.selection.main;
        const line = update.state.doc.lineAt(sel.head);
        cursorLine.set(line.number);
        // col is 1-based offset within the line
        cursorCol.set(sel.head - line.from + 1);
      }
    });

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        EditorView.lineWrapping,
        synapseThemeDark,
        ...createMarkdownExtensions(),
        ...createKeymapExtensions(saveFile),
        wikilinkAutocomplete(() => get(allFiles)),
        wikilinkDecorations,
        wikilinkStyles,
        wikilinkClickHandler((target) => navigateToLink(target)),
        tagDecorations,
        tagStyles,
        tagClickHandler((tag) => openTagNote(tag)),
        updateListener,
      ],
    });

    view = new EditorView({ state, parent: editorContainer });
  }

  let unsubFile: (() => void) | null = null;
  let mounted = false;

  // Re-initialize CodeMirror when the container element appears
  // (happens on first mount AND when switching from preview back to edit)
  $effect(() => {
    if (!editorContainer || !mounted) return;
    const file = get(activeFile);
    if (!file) return;
    queueMicrotask(() => {
      if (!editorContainer) return;
      buildView(get(activeContent));
    });
  });

  onMount(() => {
    loadAllFiles();
    mounted = true;

    unsubFile = activeFile.subscribe((file) => {
      if (!mounted) return;
      if (!editorContainer || !file) return;
      queueMicrotask(() => {
        if (!editorContainer || get(activeFile) !== file) return;
        buildView(get(activeContent));
      });
    });

    return () => { mounted = false; };
  });

  onDestroy(() => {
    unsubFile?.();
    if (view) {
      view.destroy();
      view = null;
    }
  });

  // Map saveStatus values to human-readable labels and their indicator colors
  const statusLabel: Record<string, string> = {
    saved: "Saved",
    saving: "Saving",
    unsaved: "Unsaved",
    error: "Error",
  };

  const statusColor: Record<string, string> = {
    saved: "#22c55e",   // green
    saving: "#eab308",  // yellow
    unsaved: "#f97316", // orange
    error: "#ef4444",   // red
  };
</script>

<div class="editor-shell flex flex-col h-full overflow-hidden">
  <!-- Top bar: file path + mode toggle + save status -->
  <div
    class="flex items-center px-4 py-2 shrink-0 border-b text-sm gap-3"
    style="background: var(--surface); border-color: var(--border); color: var(--text-muted);"
  >
    <span
      class="truncate font-mono text-xs pl-2"
      style="color: var(--text); border-left: 2px solid var(--accent);"
    >
      {$activeFile ?? ""}
    </span>

    <div class="flex-1"></div>

    <!-- Edit / Preview mode toggle — pill-shaped segmented control -->
    <div class="mode-toggle" role="radiogroup" aria-label="Editor mode">
      <button
        class="mode-btn"
        class:active={$editorMode === "edit"}
        onclick={() => editorMode.set("edit")}
        role="radio"
        aria-checked={$editorMode === "edit"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>
      <button
        class="mode-btn"
        class:active={$editorMode === "preview"}
        onclick={() => editorMode.set("preview")}
        role="radio"
        aria-checked={$editorMode === "preview"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Preview
      </button>
    </div>

    <span
      class="flex items-center gap-1.5 shrink-0"
      title={statusLabel[$saveStatus]}
    >
      <span
        class="inline-block rounded-full w-2.5 h-2.5 {$saveStatus === 'saving' ? 'saving-pulse' : ''}"
        style="background: {statusColor[$saveStatus]};"
        aria-hidden="true"
      ></span>
      <span>{statusLabel[$saveStatus]}</span>
    </span>
  </div>

  <!-- Editor / Preview area — conditional on mode -->
  {#if $editorMode === "edit"}
    <div bind:this={editorContainer} class="flex-1 overflow-auto cm-host"></div>
  {:else}
    <MarkdownPreview />
  {/if}

  <!-- Bottom status bar -->
  <div
    class="flex items-center justify-between px-4 py-1.5 shrink-0 border-t text-xs"
    style="background: var(--surface); border-color: var(--border); color: var(--text-muted);"
  >
    {#if $editorMode === "edit"}
      <span>Ln {$cursorLine}, Col {$cursorCol}</span>
    {:else}
      <span>Preview</span>
    {/if}
    <span>Markdown</span>
  </div>
</div>

<style>
  /* Make the CodeMirror editor fill its host container fully */
  .cm-host :global(.cm-editor) {
    height: 100%;
  }

  .cm-host :global(.cm-scroller) {
    height: 100%;
  }

  /* Pulsing animation signals that a save is in flight */
  @keyframes saving-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  .saving-pulse {
    animation: saving-pulse 1s ease-in-out infinite;
  }

  /* ── Mode toggle ───────────────────────────────────── */
  .mode-toggle {
    display: flex;
    align-items: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .mode-btn:hover:not(.active) {
    color: var(--text);
    background: var(--surface-hover);
  }

  .mode-btn.active {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
</style>
