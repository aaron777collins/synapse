<script lang="ts">
  import type { Snippet } from "svelte";
  import { sidebarOpen } from "$lib/stores/ui";
  import { activeFile, activeContent } from "$lib/stores/vault";
  import { openTabs } from "$lib/stores/tabs";
  import { editorMode } from "$lib/stores/editor";
  import Sidebar from "./Sidebar.svelte";
  import ActivityBar from "./ActivityBar.svelte";
  import ResizeHandle from "./ResizeHandle.svelte";
  import PaneView from "./PaneView.svelte";
  import SplitResizeHandle from "./SplitResizeHandle.svelte";
  import {
    panes,
    focusedPaneId,
    focusedPane,
    isSplit,
    splitRatio,
    addTabToPane,
  } from "$lib/stores/panes";

  let { children }: { children?: Snippet } = $props();

  let touchStartX = 0;
  let touchStartY = 0;

  function onTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (touchStartX < 30 && dx > 80) { sidebarOpen.set(true); return; }
    if (dx < -80) { sidebarOpen.set(false); }
  }

  function closeBackdrop() {
    sidebarOpen.set(false);
  }

  // Sync focused pane state → global stores (for sidebar, backlinks, URL history).
  // Only push when the value actually changed to avoid infinite subscription loops.
  let lastSyncedFile: string | null = null;
  let lastSyncedContent = "";
  let lastSyncedMode = "edit";

  focusedPane.subscribe((pane) => {
    if (!pane) return;
    if (pane.file !== lastSyncedFile) {
      lastSyncedFile = pane.file;
      activeFile.set(pane.file);
    }
    if (pane.content !== lastSyncedContent) {
      lastSyncedContent = pane.content;
      activeContent.set(pane.content);
    }
    if (pane.mode !== lastSyncedMode) {
      lastSyncedMode = pane.mode;
      editorMode.set(pane.mode as "edit" | "preview");
    }
    openTabs.set(pane.tabs);
  });

  let hasAnyFile = $derived($panes.some((p) => p.file !== null));
  let hasAnyTabs = $derived($panes.some((p) => p.tabs.length > 0));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex h-full"
  style="background: var(--bg); color: var(--text);"
  ontouchstart={onTouchStart}
  ontouchend={onTouchEnd}
>
  {#if $sidebarOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
      onclick={closeBackdrop}
      aria-hidden="true"
    ></div>
  {/if}

  <ActivityBar />

  {#if $sidebarOpen}
    <div
      class="flex fixed md:relative inset-y-0 md:inset-y-auto sidebar-container z-50 md:z-auto"
    >
      <Sidebar />
      <div class="hidden md:flex">
        <ResizeHandle />
      </div>
    </div>
  {/if}

  <main class="flex-1 flex flex-col overflow-hidden" style="min-width: 0;">
    {#if hasAnyFile || hasAnyTabs}
      <div class="flex flex-1 overflow-hidden">
        {#each $panes as pane, i (pane.id)}
          <div
            class="flex flex-col overflow-hidden"
            style="flex: {i === 0 ? $splitRatio : 1 - $splitRatio}; min-width: 0;"
          >
            <PaneView paneId={pane.id} />
          </div>
          {#if i === 0 && $isSplit}
            <SplitResizeHandle />
          {/if}
        {/each}
      </div>
    {:else}
      <!-- Empty state -->
      <div class="flex-1 flex items-center justify-center p-8">
        <div class="text-center max-w-md">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style="background: var(--accent-dim);"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
          </div>
          <p class="text-2xl font-bold mb-1" style="color: var(--accent);">Synapse</p>
          <p class="text-sm mb-8" style="color: var(--text-muted);">Your connected note-taking workspace</p>
          <div class="grid grid-cols-2 gap-3 text-left">
            {#each [
              { keys: 'Ctrl+K', desc: 'Quick switcher' },
              { keys: 'Ctrl+S', desc: 'Save note' },
              { keys: 'Ctrl+\\', desc: 'Toggle sidebar' },
              { keys: 'Ctrl+G', desc: 'Graph view' },
              { keys: 'Ctrl+E', desc: 'Edit / Preview' },
              { keys: 'Ctrl+Shift+F', desc: 'Search notes' },
            ] as shortcut}
              <div class="flex items-center gap-3 px-3 py-2 rounded-lg" style="background: var(--surface);">
                <kbd class="text-xs font-mono px-2 py-1 rounded" style="background: var(--bg); border: 1px solid var(--border); color: var(--text-muted);">
                  {shortcut.keys}
                </kbd>
                <span class="text-xs" style="color: var(--text-muted);">{shortcut.desc}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .sidebar-container {
    left: 48px;
  }

  @media (min-width: 768px) {
    .sidebar-container {
      left: auto;
    }
  }
</style>
