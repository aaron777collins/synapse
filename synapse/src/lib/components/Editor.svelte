<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, lineNumbers, highlightActiveLine } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import { allFiles, navigateToLink, loadAllFiles } from "$lib/stores/vault";
  import { synapseThemeDark } from "$lib/editor/theme";
  import MarkdownPreview from "./MarkdownPreview.svelte";
  import { createMarkdownExtensions, loadCodeLanguages } from "$lib/editor/markdown";
  import { createKeymapExtensions } from "$lib/editor/keymaps";
  import { wikilinkAutocomplete, wikilinkDecorations, wikilinkStyles, wikilinkClickHandler } from "$lib/editor/wikilink";
  import { tagDecorations, tagStyles, tagClickHandler } from "$lib/editor/tags";
  import { openTagNote } from "$lib/stores/tagNote";
  import { debounce } from "$lib/utils/debounce";
  import { get } from "svelte/store";
  import {
    panes,
    setPaneContent,
    setPaneCursor,
    setPaneMode,
    savePaneFile,
    type PaneState,
  } from "$lib/stores/panes";

  let { paneId = "pane-1" }: { paneId?: string } = $props();

  let pane = $derived($panes.find((p: PaneState) => p.id === paneId) ?? $panes[0]);

  let editorContainer: HTMLDivElement = $state()!;
  let view: EditorView | null = $state(null);
  const mdCompartment = new Compartment();

  const debouncedSave = debounce(() => {
    savePaneFile(paneId);
  }, 1200);

  function buildView(content: string) {
    if (view) {
      view.destroy();
      view = null;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const text = update.state.doc.toString();
        setPaneContent(paneId, text);
        debouncedSave();
      }

      if (update.selectionSet) {
        const sel = update.state.selection.main;
        const line = update.state.doc.lineAt(sel.head);
        setPaneCursor(paneId, line.number, sel.head - line.from + 1);
      }
    });

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        EditorView.lineWrapping,
        synapseThemeDark,
        mdCompartment.of(createMarkdownExtensions()),
        ...createKeymapExtensions(() => savePaneFile(paneId)),
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

    loadCodeLanguages().then((langs) => {
      view?.dispatch({
        effects: mdCompartment.reconfigure(createMarkdownExtensions(langs)),
      });
    });
  }

  let lastFile: string | null = null;
  let mounted = false;

  $effect(() => {
    const file = pane.file;
    const content = pane.content;
    if (!editorContainer || !mounted) return;
    if (!file) return;
    if (file !== lastFile) {
      lastFile = file;
      queueMicrotask(() => {
        if (!editorContainer) return;
        buildView(content);
      });
    }
  });

  // Rebuild when switching from preview back to edit
  $effect(() => {
    if (!editorContainer || !mounted) return;
    const content = pane.content;
    if (pane.mode === "edit" && pane.file) {
      queueMicrotask(() => {
        if (!editorContainer || view) return;
        buildView(content);
      });
    }
  });

  onMount(() => {
    loadAllFiles();
    mounted = true;
    if (pane.file && editorContainer) {
      queueMicrotask(() => {
        if (editorContainer) buildView(pane.content);
      });
    }
    return () => { mounted = false; };
  });

  onDestroy(() => {
    if (view) {
      view.destroy();
      view = null;
    }
  });

  const statusLabel: Record<string, string> = {
    saved: "Saved",
    saving: "Saving",
    unsaved: "Unsaved",
    error: "Error",
  };

  const statusColor: Record<string, string> = {
    saved: "#22c55e",
    saving: "#eab308",
    unsaved: "#f97316",
    error: "#ef4444",
  };
</script>

<div class="editor-shell flex flex-col h-full overflow-hidden">
  <div
    class="flex items-center py-2 shrink-0 border-b text-sm gap-3"
    style="background: var(--surface); border-color: var(--border); color: var(--text-muted); padding-left: 16px; padding-right: 24px;"
  >
    <span
      class="truncate font-mono text-xs pl-2"
      style="color: var(--text); border-left: 2px solid var(--accent);"
    >
      {pane.file ?? ""}
    </span>

    <div class="flex-1"></div>

    <div class="mode-toggle" role="radiogroup" aria-label="Editor mode">
      <button
        class="mode-btn"
        class:active={pane.mode === "edit"}
        onclick={() => setPaneMode(paneId, "edit")}
        role="radio"
        aria-checked={pane.mode === "edit"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>
      <button
        class="mode-btn"
        class:active={pane.mode === "preview"}
        onclick={() => setPaneMode(paneId, "preview")}
        role="radio"
        aria-checked={pane.mode === "preview"}
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
      title={statusLabel[pane.saveStatus]}
    >
      <span
        class="inline-block rounded-full w-2.5 h-2.5 {pane.saveStatus === 'saving' ? 'saving-pulse' : ''}"
        style="background: {statusColor[pane.saveStatus]};"
        aria-hidden="true"
      ></span>
      <span>{statusLabel[pane.saveStatus]}</span>
    </span>
  </div>

  {#if pane.mode === "edit"}
    <div bind:this={editorContainer} class="flex-1 overflow-auto cm-host"></div>
  {:else}
    <MarkdownPreview content={pane.content} />
  {/if}

  <div
    class="flex items-center justify-between px-4 py-1.5 shrink-0 border-t text-xs"
    style="background: var(--surface); border-color: var(--border); color: var(--text-muted);"
  >
    {#if pane.mode === "edit"}
      <span>Ln {pane.cursorLine}, Col {pane.cursorCol}</span>
    {:else}
      <span>Preview</span>
    {/if}
    <span>Markdown</span>
  </div>
</div>

<style>
  .cm-host :global(.cm-editor) {
    height: 100%;
  }

  .cm-host :global(.cm-scroller) {
    height: 100%;
  }

  @keyframes saving-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  .saving-pulse {
    animation: saving-pulse 1s ease-in-out infinite;
  }

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
