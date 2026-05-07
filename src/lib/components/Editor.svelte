<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, lineNumbers, highlightActiveLine } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { activeFile, activeContent, dirty, saveStatus, saveFile } from "$lib/stores/vault";
  import { cursorLine, cursorCol } from "$lib/stores/editor";
  import { synapseThemeDark } from "$lib/editor/theme";
  import { createMarkdownExtensions } from "$lib/editor/markdown";
  import { createKeymapExtensions } from "$lib/editor/keymaps";
  import { debounce } from "$lib/utils/debounce";

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
        updateListener,
      ],
    });

    view = new EditorView({ state, parent: editorContainer });
  }

  // Re-build the editor whenever the active file changes.
  // Using $effect so it runs after the DOM is mounted and whenever $activeFile changes.
  $effect(() => {
    const file = $activeFile;
    const content = $activeContent;

    // Only act when there is both a container and an open file
    if (!editorContainer || !file) return;

    buildView(content);
  });

  onDestroy(() => {
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
  <!-- Top bar: file path + save status -->
  <div
    class="flex items-center justify-between px-4 py-2 shrink-0 border-b text-sm"
    style="background: var(--surface); border-color: var(--border); color: var(--text-muted);"
  >
    <span class="truncate font-mono text-xs" style="color: var(--text);">
      {$activeFile ?? ""}
    </span>
    <span
      class="flex items-center gap-1.5 shrink-0 ml-4"
      title={statusLabel[$saveStatus]}
    >
      <!-- Colored dot indicates save state at a glance -->
      <span
        class="inline-block rounded-full w-2 h-2"
        style="background: {statusColor[$saveStatus]};"
        aria-hidden="true"
      ></span>
      <span>{statusLabel[$saveStatus]}</span>
    </span>
  </div>

  <!-- CodeMirror mount point — takes all remaining vertical space -->
  <div bind:this={editorContainer} class="flex-1 overflow-auto cm-host"></div>

  <!-- Bottom status bar: cursor position + language -->
  <div
    class="flex items-center justify-between px-4 py-1 shrink-0 border-t text-xs"
    style="background: var(--surface); border-color: var(--border); color: var(--text-muted);"
  >
    <span>Ln {$cursorLine}, Col {$cursorCol}</span>
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
</style>
