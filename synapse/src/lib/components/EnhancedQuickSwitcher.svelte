<script lang="ts">
  import { allFiles, recentFiles, openFile } from "$lib/stores/vault";
  import { fuzzySort } from "$lib/services/fuzzy";
  import { api, type SearchResult } from "$lib/services/api";

  let { open = $bindable(false) }: { open: boolean } = $props();

  let query = $state("");
  let selectedIndex = $state(0);
  let inputEl: HTMLInputElement | undefined = $state(undefined);
  let contentResults = $state<SearchResult[]>([]);
  let searching = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function basename(path: string): string {
    const parts = path.split("/");
    return parts[parts.length - 1];
  }

  function stripExtension(name: string): string {
    return name.replace(/\.[^/.]+$/, "");
  }

  let fileResults = $derived.by(() => {
    if (!query.trim()) {
      return $recentFiles.slice(0, 10);
    }
    const scored = fuzzySort(
      query,
      $allFiles.map((path) => stripExtension(basename(path)))
    );
    const basenameToPath = new Map<string, string>();
    for (const path of $allFiles) {
      basenameToPath.set(stripExtension(basename(path)), path);
    }
    return scored.map((name) => basenameToPath.get(name)).filter((p): p is string => !!p);
  });

  // Deduplicated content results — exclude files already in fileResults
  let filteredContentResults = $derived.by(() => {
    const fileSet = new Set(fileResults);
    return contentResults.filter((r) => !fileSet.has(r.path));
  });

  // Combined flat list for keyboard navigation
  type ResultItem = { type: "file"; path: string } | { type: "content"; result: SearchResult };
  let allResults = $derived.by(() => {
    const items: ResultItem[] = fileResults.map((path) => ({ type: "file" as const, path }));
    for (const r of filteredContentResults) {
      items.push({ type: "content" as const, result: r });
    }
    return items;
  });

  $effect(() => {
    void allResults;
    selectedIndex = 0;
  });

  $effect(() => {
    if (open && inputEl) {
      requestAnimationFrame(() => inputEl?.focus());
    }
    if (!open) {
      query = "";
      contentResults = [];
      searching = false;
    }
  });

  // Debounced content search
  $effect(() => {
    const q = query.trim();
    if (debounceTimer) clearTimeout(debounceTimer);
    if (q.length < 2) {
      contentResults = [];
      searching = false;
      return;
    }
    searching = true;
    debounceTimer = setTimeout(async () => {
      try {
        contentResults = await api.search(q);
      } catch {
        contentResults = [];
      }
      searching = false;
    }, 250);
  });

  function close() {
    open = false;
  }

  function selectPath(path: string) {
    openFile(path);
    close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, allResults.length - 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      return;
    }
    if (e.key === "Enter") {
      const item = allResults[selectedIndex];
      if (item) selectPath(item.type === "file" ? item.path : item.result.path);
      return;
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 qs-backdrop"
    style="padding-top: clamp(4rem, 18vh, 10rem);"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
  >
    <div
      class="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden qs-panel"
      style="background: var(--surface); border: 1px solid var(--border);"
    >
      <div class="px-4 py-3.5" style="border-bottom: 1px solid var(--border);">
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          placeholder="Search notes and content..."
          onkeydown={handleKeydown}
          class="w-full bg-transparent text-base outline-none"
          style="color: var(--text);"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <ul class="max-h-96 overflow-y-auto" role="listbox">
        {#if allResults.length === 0 && !searching}
          <li class="px-4 py-6 text-sm text-center" style="color: var(--text-muted);">
            {query.trim() ? "No matches found." : "Start typing to search..."}
          </li>
        {/if}

        <!-- File name matches -->
        {#if fileResults.length > 0}
          {#if query.trim()}
            <li class="section-label">Files</li>
          {/if}
          {#each fileResults as path, i (path)}
            {@const idx = i}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <li
              role="option"
              aria-selected={idx === selectedIndex}
              onclick={() => selectPath(path)}
              class="result-item"
              class:selected={idx === selectedIndex}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="result-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium truncate" style="color: var(--text);">{stripExtension(basename(path))}</span>
                <span class="text-xs truncate" style="color: var(--text-muted);">{path}</span>
              </div>
            </li>
          {/each}
        {/if}

        <!-- Content matches -->
        {#if filteredContentResults.length > 0}
          <li class="section-label">Content</li>
          {#each filteredContentResults as result, i (result.path)}
            {@const idx = fileResults.length + i}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <li
              role="option"
              aria-selected={idx === selectedIndex}
              onclick={() => selectPath(result.path)}
              class="result-item"
              class:selected={idx === selectedIndex}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="result-icon">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium truncate" style="color: var(--text);">{stripExtension(basename(result.path))}</span>
                {#if result.matches.length > 0}
                  <span class="text-xs truncate" style="color: var(--text-muted);">
                    L{result.matches[0].lineNumber}: {result.matches[0].content.trim()}
                  </span>
                {/if}
              </div>
            </li>
          {/each}
        {/if}

        {#if searching && filteredContentResults.length === 0 && fileResults.length === 0}
          <li class="px-4 py-4 text-sm text-center" style="color: var(--text-muted);">Searching...</li>
        {/if}
      </ul>

      <div
        class="flex gap-4 px-4 py-2.5 text-xs items-center"
        style="color: var(--text); opacity: 0.65; border-top: 1px solid var(--border);"
      >
        <span class="flex items-center gap-1"><kbd>↑↓</kbd> navigate</span>
        <span class="flex items-center gap-1"><kbd>↵</kbd> open</span>
        <span class="flex items-center gap-1"><kbd>Esc</kbd> close</span>
        <span class="ml-auto flex items-center gap-1"><kbd>⌘⇧K</kbd> files only</span>
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

  .section-label {
    padding: 8px 16px 4px;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    pointer-events: none;
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    margin: 2px 8px;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.1s ease;
  }

  .result-item.selected {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
  }

  .result-item:hover:not(.selected) {
    background: var(--surface-hover);
  }

  .result-icon {
    color: var(--text-muted);
    flex-shrink: 0;
  }

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
