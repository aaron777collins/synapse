<script lang="ts">
  import { openTabs, activeTab, closeTab } from "$lib/stores/tabs";
  import { activeFile, openFile } from "$lib/stores/vault";
  import { basename, stripExtension } from "$lib/utils/paths";
  import { isTagNotePath, tagFromPath } from "$lib/utils/virtualPaths";

  function handleTabClick(path: string) {
    // Don't re-open if already active — avoids a redundant API call
    if ($activeTab === path) return;
    openFile(path);
  }

  function handleClose(e: MouseEvent, path: string) {
    // Stop the click from also firing the tab-select handler
    e.stopPropagation();
    closeTab(path, (next) => {
      if (next) {
        openFile(next);
      } else {
        activeFile.set(null);
      }
    });
  }

  function handleMiddleClick(e: MouseEvent, path: string) {
    // Middle-click to close, matching VS Code muscle memory
    if (e.button !== 1) return;
    e.preventDefault();
    closeTab(path, (next) => {
      if (next) {
        openFile(next);
      } else {
        activeFile.set(null);
      }
    });
  }
</script>

{#if $openTabs.length > 0}
  <div class="tab-bar" role="tablist" aria-label="Open files">
    {#each $openTabs as path (path)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      {@const isTagTab = isTagNotePath(path)}
      <div
        class="tab"
        class:active={$activeTab === path}
        class:tag-tab={isTagTab}
        role="tab"
        aria-selected={$activeTab === path}
        title={path}
        onclick={() => handleTabClick(path)}
        onmousedown={(e) => handleMiddleClick(e, path)}
        tabindex="0"
        onkeydown={(e) => e.key === "Enter" && handleTabClick(path)}
      >
        {#if isTagTab}
          <!-- Tag note tabs get a subtle hash prefix to distinguish them from file tabs -->
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
    /* Hide the scrollbar track but keep scrolling functional */
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
    /* Bottom accent bar for the active tab */
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

  /* Show close button on hover or when tab is active */
  .tab:hover .tab-close,
  .tab.active .tab-close {
    opacity: 0.6;
  }

  .tab-close:hover {
    opacity: 1 !important;
    background: var(--surface-hover);
  }

  /* Tag note tabs: accent-colored hash prefix + slightly different name tint
     so they are visually distinct from regular file tabs at a glance */
  .tab-tag-prefix {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent);
    flex-shrink: 0;
    /* Shift up slightly so the hash aligns optically with the tab name */
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
