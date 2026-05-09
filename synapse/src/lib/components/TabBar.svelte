<script lang="ts">
  import { basename, stripExtension } from "$lib/utils/paths";
  import { isTagNotePath, tagFromPath } from "$lib/utils/virtualPaths";
  import {
    panes,
    openFileInPane,
    closeTabInPane,
    type PaneState,
  } from "$lib/stores/panes";

  let { paneId = "pane-1" }: { paneId?: string } = $props();

  let pane = $derived($panes.find((p: PaneState) => p.id === paneId) ?? $panes[0]);

  function handleTabClick(path: string) {
    if (pane.file === path) return;
    openFileInPane(paneId, path);
  }

  function handleClose(e: MouseEvent, path: string) {
    e.stopPropagation();
    closeTabInPane(paneId, path);
  }

  function handleMiddleClick(e: MouseEvent, path: string) {
    if (e.button !== 1) return;
    e.preventDefault();
    closeTabInPane(paneId, path);
  }

  function handleDragStart(e: DragEvent, path: string) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData(
      "application/synapse-tab",
      JSON.stringify({ sourcePaneId: paneId, filePath: path })
    );
    e.dataTransfer.effectAllowed = "move";
  }
</script>

{#if pane.tabs.length > 0}
  <div class="tab-bar" role="tablist" aria-label="Open files">
    {#each pane.tabs as path (path)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      {@const isTagTab = isTagNotePath(path)}
      <div
        class="tab"
        class:active={pane.file === path}
        class:tag-tab={isTagTab}
        role="tab"
        aria-selected={pane.file === path}
        title={path}
        draggable="true"
        onclick={() => handleTabClick(path)}
        onmousedown={(e) => handleMiddleClick(e, path)}
        ondragstart={(e) => handleDragStart(e, path)}
        tabindex="0"
        onkeydown={(e) => e.key === "Enter" && handleTabClick(path)}
      >
        {#if isTagTab}
          <span class="tab-tag-prefix" aria-hidden="true">#</span>
          <span class="tab-name tab-name--tag">{tagFromPath(path)}</span>
        {:else}
          <span class="tab-name">{stripExtension(basename(path))}</span>
        {/if}
        <button
          class="tab-close"
          onclick={(e) => handleClose(e, path)}
          aria-label={`Close ${isTagTab ? `#${tagFromPath(path)}` : basename(path)}`}
          tabindex="-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .tab-bar {
    display: flex;
    align-items: stretch;
    height: 35px;
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    scrollbar-width: none;
  }

  .tab-bar::-webkit-scrollbar {
    display: none;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px 0 14px;
    min-width: 80px;
    max-width: 200px;
    height: 100%;
    flex-shrink: 0;
    cursor: pointer;
    position: relative;
    color: var(--text-muted);
    font-size: 12px;
    border-right: 1px solid var(--border);
    transition: color 0.1s ease, background 0.1s ease;
    user-select: none;
  }

  .tab::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent);
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  .tab:hover {
    color: var(--text);
    background: var(--surface-hover);
  }

  .tab.active {
    color: var(--text);
    background: var(--surface);
  }

  .tab.active::after {
    opacity: 1;
  }

  .tab-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: inherit;
    opacity: 0;
    transition: opacity 0.1s ease, background 0.1s ease;
    padding: 0;
  }

  .tab:hover .tab-close,
  .tab.active .tab-close {
    opacity: 0.6;
  }

  .tab-close:hover {
    opacity: 1 !important;
    background: var(--surface-hover);
  }

  .tab-tag-prefix {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent);
    flex-shrink: 0;
    line-height: 1;
    margin-top: -1px;
  }

  .tab-name--tag {
    color: var(--accent);
  }

  .tab.tag-tab:not(.active) .tab-tag-prefix,
  .tab.tag-tab:not(.active) .tab-name--tag {
    color: var(--accent);
    opacity: 0.75;
  }

  .tab.tag-tab.active .tab-tag-prefix,
  .tab.tag-tab.active .tab-name--tag {
    color: var(--accent);
    opacity: 1;
  }
</style>
