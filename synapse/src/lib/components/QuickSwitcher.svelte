<script lang="ts">
  import { allFiles, recentFiles, openFile } from "$lib/stores/vault";
  import { fuzzySort } from "$lib/services/fuzzy";

  let { open = $bindable(false) }: { open: boolean } = $props();

  let query = $state("");
  let selectedIndex = $state(0);
  let inputEl: HTMLInputElement | undefined = $state(undefined);

  function basename(path: string): string {
    const parts = path.split("/");
    return parts[parts.length - 1];
  }

  function stripExtension(name: string): string {
    return name.replace(/\.[^/.]+$/, "");
  }

  // When query is empty show recent files; otherwise fuzzy-match against all files by basename
  let results = $derived.by(() => {
    if (!query.trim()) {
      return $recentFiles.slice(0, 10);
    }
    const scored = fuzzySort(
      query,
      $allFiles.map((path) => stripExtension(basename(path)))
    );
    // Map scored basenames back to full paths preserving order
    const basenameToPath = new Map<string, string>();
    for (const path of $allFiles) {
      basenameToPath.set(stripExtension(basename(path)), path);
    }
    return scored.map((name) => basenameToPath.get(name)).filter((p): p is string => !!p);
  });

  // Reset selection when results change
  $effect(() => {
    // Referencing results here makes the effect re-run whenever it updates
    void results;
    selectedIndex = 0;
  });

  // Auto-focus the input whenever the modal opens
  $effect(() => {
    if (open && inputEl) {
      // Defer one frame so the element is visible before we focus
      requestAnimationFrame(() => inputEl?.focus());
    }
    if (!open) {
      query = "";
    }
  });

  function close() {
    open = false;
  }

  function selectFile(path: string) {
    openFile(path);
    close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      return;
    }
    if (e.key === "Enter") {
      const chosen = results[selectedIndex];
      if (chosen) selectFile(chosen);
      return;
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- Backdrop fades in; modal scales up from 95% to add a sense of depth -->
  <div
    class="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 qs-backdrop"
    style="padding-top: clamp(4rem, 18vh, 10rem);"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
  >
    <!-- Modal panel -->
    <div
      class="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden qs-panel"
      style="background: var(--surface); border: 1px solid var(--border);"
    >
      <!-- Search input — text-base makes it feel intentional and easy to read -->
      <div class="px-4 py-3.5" style="border-bottom: 1px solid var(--border);">
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          placeholder="Jump to note..."
          onkeydown={handleKeydown}
          class="w-full bg-transparent text-base outline-none"
          style="color: var(--text);"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <!-- Result list -->
      <ul class="max-h-80 overflow-y-auto" role="listbox">
        {#if results.length === 0}
          <li class="px-4 py-6 text-sm text-center" style="color: var(--text-muted);">
            No matching notes.
          </li>
        {:else}
          {#each results as path, i (path)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <li
              role="option"
              aria-selected={i === selectedIndex}
              onclick={() => selectFile(path)}
              class="flex items-center gap-3 px-3 py-3 mx-2 my-0.5 cursor-pointer rounded-lg transition-colors"
              style={i === selectedIndex
                ? "background: color-mix(in srgb, var(--accent) 15%, transparent);"
                : ""}
            >
              <!-- File icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="color: var(--text-muted); flex-shrink: 0;"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>

              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium truncate" style="color: var(--text);">
                  {stripExtension(basename(path))}
                </span>
                <span class="text-xs truncate" style="color: var(--text-muted);">{path}</span>
              </div>
            </li>
          {/each}
        {/if}
      </ul>

      <!-- Footer hint row — slightly brighter text; keyboard-key styled spans -->
      <div
        class="flex gap-4 px-4 py-2.5 text-xs items-center"
        style="color: var(--text); opacity: 0.65; border-top: 1px solid var(--border);"
      >
        <span class="flex items-center gap-1"><kbd>↑↓</kbd> navigate</span>
        <span class="flex items-center gap-1"><kbd>↵</kbd> open</span>
        <span class="flex items-center gap-1"><kbd>Esc</kbd> close</span>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes qs-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes qs-scale-in {
    from { opacity: 0; transform: scale(0.95) translateY(-6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .qs-backdrop {
    animation: qs-fade-in 0.15s ease-out both;
  }

  .qs-panel {
    animation: qs-scale-in 0.15s ease-out both;
  }

  /* kbd elements use the surface color to look like physical keys */
  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-family: inherit;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    opacity: 1;
  }
</style>
