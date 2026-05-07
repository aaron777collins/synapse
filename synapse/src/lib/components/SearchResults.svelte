<script lang="ts">
  import { searchResults, searchActive, searchQuery } from "$lib/stores/search";
  import { openFile } from "$lib/stores/vault";

  // Escape regex special characters so user input is treated as a literal string
  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Escape HTML entities before injecting content into {@html} to prevent XSS.
  // Search result content comes directly from file text which may contain
  // arbitrary characters including <, >, & that would otherwise be interpreted
  // as HTML markup.
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlightMatch(content: string, query: string): string {
    const safe = escapeHtml(content);
    if (!query.trim()) return safe;
    const escaped = escapeRegex(query.trim());
    const regex = new RegExp(`(${escaped})`, "gi");
    return safe.replace(regex, "<mark>$1</mark>");
  }

  function clearSearch() {
    searchQuery.set("");
    searchActive.set(false);
    searchResults.set([]);
  }

  function basename(path: string): string {
    const parts = path.split("/");
    return parts[parts.length - 1];
  }
</script>

{#if $searchActive}
  <div class="flex flex-col flex-1 overflow-hidden">
    <!-- Header row with result count and clear button -->
    <div
      class="flex items-center justify-between px-3 py-2 text-xs font-medium"
      style="color: var(--text-muted); border-bottom: 1px solid var(--border);"
    >
      <span>{$searchResults.length} result{$searchResults.length === 1 ? "" : "s"}</span>
      <button
        onclick={clearSearch}
        class="px-2 py-0.5 rounded text-xs transition-colors hover:bg-[var(--surface-hover)]"
        style="color: var(--accent);"
      >
        Clear
      </button>
    </div>

    <!-- py-1 adds top/bottom breathing room to the scroll area -->
    <div class="flex-1 overflow-y-auto py-1">
      {#if $searchResults.length === 0}
        <p class="px-4 py-6 text-sm text-center" style="color: var(--text-muted);">
          No results found.
        </p>
      {:else}
        <!-- mx-2 + rounded-md give each card its own visual identity -->
        {#each $searchResults as result (result.path)}
          <div
            class="my-1 mx-2 rounded-md transition-colors hover:bg-[var(--surface-hover)]"
            style="border: 1px solid var(--border);"
          >
            <!-- Filename header — clickable to open the file -->
            <button
              onclick={() => openFile(result.path)}
              class="w-full text-left text-sm font-semibold px-3 pt-2 pb-1 truncate block hover:underline"
              style="color: var(--accent);"
            >
              {basename(result.path)}
            </button>

            <!-- Show up to 3 matching lines with highlighted query terms -->
            <div class="px-3 pb-2 flex flex-col gap-0.5">
              {#each result.matches.slice(0, 3) as match}
                <div class="flex gap-2 text-xs leading-relaxed" style="color: var(--text-muted);">
                  <!-- Fixed-width right-aligned line numbers for clean alignment -->
                  <span
                    class="shrink-0 tabular-nums text-right"
                    style="min-width: 2.5em; opacity: 0.6;"
                  >{match.lineNumber}</span>
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  <span class="truncate">{@html highlightMatch(match.content, $searchQuery)}</span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Softer highlight: accent-dim background keeps text readable in both themes */
  :global(mark) {
    background: var(--accent-dim);
    color: var(--accent);
    border-radius: 2px;
    padding: 0 2px;
  }
</style>
