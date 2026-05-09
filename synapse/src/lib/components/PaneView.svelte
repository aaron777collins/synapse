<script lang="ts">
  import { derived } from "svelte/store";
  import TabBar from "./TabBar.svelte";
  import Editor from "./Editor.svelte";
  import TagNoteView from "./TagNoteView.svelte";
  import BacklinksPanel from "./BacklinksPanel.svelte";
  import EditorToolbar from "./EditorToolbar.svelte";
  import { isTagNotePath } from "$lib/utils/virtualPaths";
  import {
    panes,
    focusedPaneId,
    isSplit,
    setFocus,
    closePane,
    splitWithFile,
    moveTabToOtherPane,
    openFileInPane,
    type PaneState,
  } from "$lib/stores/panes";

  let { paneId }: { paneId: string } = $props();

  let paneState = $derived(
    $panes.find((p: PaneState) => p.id === paneId) ?? $panes[0]
  );
  let isFocused = $derived($focusedPaneId === paneId);

  let dragOver: "left" | "right" | null = $state(null);

  function handleFocus() {
    if (!isFocused) setFocus(paneId);
  }

  function handleDragOver(e: DragEvent) {
    if (!e.dataTransfer?.types.includes("application/synapse-tab")) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    dragOver = e.clientX < midX ? "left" : "right";
  }

  function handleDragLeave() {
    dragOver = null;
  }

  function handleDrop(e: DragEvent) {
    const side = dragOver;
    dragOver = null;
    const data = e.dataTransfer?.getData("application/synapse-tab");
    if (!data) return;
    e.preventDefault();
    const { sourcePaneId, filePath } = JSON.parse(data);

    if ($isSplit) {
      if (sourcePaneId !== paneId) {
        moveTabToOtherPane(sourcePaneId, filePath);
      } else {
        openFileInPane(paneId, filePath);
      }
    } else {
      splitWithFile(paneId, filePath, side ?? "right");
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="pane-view"
  class:focused={isFocused}
  class:unfocused={!isFocused && $isSplit}
  onclick={handleFocus}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  {#if paneState.file}
    <TabBar {paneId} />
    {#if isTagNotePath(paneState.file)}
      <TagNoteView />
    {:else}
      <Editor {paneId} />
      {#if isFocused}
        <BacklinksPanel />
        <EditorToolbar />
      {/if}
    {/if}
  {:else if paneState.tabs.length > 0}
    <TabBar {paneId} />
    <div class="flex-1 flex items-center justify-center p-8">
      <p class="text-sm" style="color: var(--text-muted);">Select a tab to start editing</p>
    </div>
  {:else if $isSplit}
    <div class="flex-1 flex items-center justify-center p-4">
      <button
        class="text-xs px-3 py-1.5 rounded-md transition-colors"
        style="color: var(--text-muted); border: 1px solid var(--border);"
        onclick={() => closePane(paneId)}
      >
        Close pane
      </button>
    </div>
  {:else}
    <div class="flex-1"></div>
  {/if}

  <!-- Drop zone overlays shown during tab drag -->
  {#if dragOver}
    <div class="drop-zone {dragOver === 'left' ? 'drop-left' : 'drop-right'}"></div>
  {/if}
</div>

<style>
  .pane-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    position: relative;
    min-width: 200px;
  }

  .unfocused {
    opacity: 0.85;
  }

  .unfocused:hover {
    opacity: 1;
  }

  .drop-zone {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    z-index: 50;
    pointer-events: none;
    border: 2px dashed var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    transition: opacity 0.1s;
  }

  .drop-left {
    left: 0;
    border-right: none;
    border-radius: 8px 0 0 8px;
  }

  .drop-right {
    right: 0;
    border-left: none;
    border-radius: 0 8px 8px 0;
  }
</style>
