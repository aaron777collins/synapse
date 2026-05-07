<script lang="ts">
  import type { Snippet } from "svelte";
  import { sidebarOpen } from "$lib/stores/ui";
  import { activeFile } from "$lib/stores/vault";
  import Sidebar from "./Sidebar.svelte";
  import Editor from "./Editor.svelte";
  import EditorToolbar from "./EditorToolbar.svelte";
  import BacklinksPanel from "./BacklinksPanel.svelte";

  let { children }: { children?: Snippet } = $props();

  // Touch-gesture state — tracks where the current touch started
  let touchStartX = 0;
  let touchStartY = 0;

  function onTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    // Ignore mostly-vertical swipes so scrolling still works
    if (Math.abs(dy) > Math.abs(dx)) return;

    // Swipe right from left edge opens the sidebar
    if (touchStartX < 30 && dx > 80) {
      sidebarOpen.set(true);
      return;
    }

    // Swipe left closes the sidebar
    if (dx < -80) {
      sidebarOpen.set(false);
    }
  }

  function closeBackdrop() {
    sidebarOpen.set(false);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex h-full"
  style="background: var(--bg); color: var(--text);"
  ontouchstart={onTouchStart}
  ontouchend={onTouchEnd}
>
  <!-- Mobile: fixed overlay sidebar with backdrop -->
  <!-- Desktop: normal in-flow sidebar, visibility controlled by sidebarOpen -->

  {#if $sidebarOpen}
    <!-- Backdrop — only rendered on mobile (hidden via md:hidden) -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
      onclick={closeBackdrop}
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Sidebar: fixed overlay on mobile, in-flow on desktop -->
  <div
    class="
      {$sidebarOpen ? 'flex' : 'hidden'}
      md:flex
      fixed md:relative
      inset-y-0 left-0
      z-50 md:z-auto
    "
  >
    <Sidebar />
  </div>

  <!-- Main content area -->
  <main class="flex-1 flex flex-col overflow-hidden" style="min-width: 0;">
    <!-- Mobile hamburger — shown only when sidebar is closed; backdrop-blur lifts it above content -->
    {#if !$sidebarOpen}
      <button
        onclick={() => sidebarOpen.set(true)}
        class="fixed top-3 left-3 z-30 md:hidden p-2 rounded-lg transition-colors backdrop-blur-sm"
        style="background: color-mix(in srgb, var(--surface) 85%, transparent); border: 1px solid var(--border); color: var(--text);"
        aria-label="Open sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    {/if}

    {#if $activeFile}
      <!-- Editor + backlinks panel + mobile toolbar fill the remaining content area -->
      <Editor />
      <BacklinksPanel />
      <EditorToolbar />
    {:else}
      <!-- No file selected — rich empty state with branding, subtitle, and shortcut hints -->
      <div class="flex-1 flex items-center justify-center p-8">
        <div class="text-center max-w-md">
          <!-- Decorative icon anchors the brand mark -->
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
              { keys: 'Ctrl+.', desc: 'Toggle backlinks' },
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
