<script lang="ts">
  import { searchResults, searchActive, searchQuery } from "$lib/stores/search";
  import { openFile } from "$lib/stores/vault";

  // Escape regex special characters so user input is treated as a literal string
  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightMatch(content: string, query: string): string {
    if (!query.trim()) return content;
    const escaped = escapeRegex(query.trim());
    const regex = new RegExp(`(${escaped})`, "gi");
    return content.replace(regex, "<mark>$1</mark>");
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

    <div class="flex-1 overflow-y-auto">
      {#if $searchResults.length === 0}
        <p class="px-4 py-6 text-sm text-center" style="color: var(--text-muted);">
          No results found.
        </p>
      {:else}
        {#each $searchResults as result (result.path)}
          <div class="py-2 px-3" style="border-bottom: 1px solid var(--border);">
            <!-- Filename header — clickable to open the file -->
            <button
              onclick={() => openFile(result.path)}
              class="w-full text-left text-sm font-semibold mb-1 truncate block hover:underline"
              style="color: var(--accent);"
            >
              {basename(result.path)}
            </button>

            <!-- Show up to 3 matching lines with highlighted query terms -->
            {#each result.matches.slice(0, 3) as match}
              <div class="flex gap-2 text-xs leading-relaxed" style="color: var(--text-muted);">
                <span class="shrink-0 tabular-nums">{match.lineNumber}</span>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                <span class="truncate">{@html highlightMatch(match.content, $searchQuery)}</span>
              </div>
            {/each}
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(mark) {
    background: var(--accent);
    color: #fff;
    border-radius: 2px;
    padding: 0 1px;
  }
</style>
