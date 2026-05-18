<script lang="ts">
  import FileTreeNode from "./FileTreeNode.svelte";
  import { activeFile, loadDir, openFile, expandedDirs, childrenByDir } from "$lib/stores/vault";
  import type { FileEntry } from "$lib/services/api";

  let { entry, depth = 0 }: { entry: FileEntry; depth?: number } = $props();

  // Derived values reference props inside $derived so Svelte 5 tracks them reactively
  const isDir = $derived(entry.type === "dir");
  const paddingLeft = $derived(12 + depth * 16);

  // Expand a directory on first click by loading its contents lazily
  async function toggleDir() {
    const isExpanded = $expandedDirs.has(entry.path);
    if (isExpanded) {
      expandedDirs.update((s) => { s.delete(entry.path); return new Set(s); });
    } else {
      expandedDirs.update((s) => { s.add(entry.path); return new Set(s); });
      // Only fetch if we haven't loaded this dir yet
      if (!$childrenByDir.has(entry.path)) {
        await loadDir(entry.path);
      }
    }
  }

  function handleFileClick() {
    openFile(entry.path);
  }
</script>

{#if isDir}
  <!-- Directory row -->
  <button
    onclick={toggleDir}
    class="flex items-center gap-1.5 w-full text-left text-sm transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
    style="min-height: 36px; padding-left: {paddingLeft}px; padding-right: 8px; color: var(--text);"
    aria-expanded={$expandedDirs.has(entry.path)}
  >
    <!-- Chevron rotates when expanded -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="flex-shrink: 0; transition: transform 0.15s; transform: rotate({$expandedDirs.has(entry.path) ? 90 : 0}deg);"
    >
      <polyline points="9 18 15 12 9 6"/>
    </svg>
    <!-- Folder icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="flex-shrink: 0; color: var(--accent);"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="truncate">{entry.name}</span>
  </button>

  <!-- Render children recursively when expanded -->
  {#if $expandedDirs.has(entry.path) && $childrenByDir.has(entry.path)}
    {#each $childrenByDir.get(entry.path)! as child (child.path)}
      <FileTreeNode entry={child} depth={depth + 1} />
    {/each}
  {/if}
{:else}
  <!-- File row — highlighted when it's the active file -->
  <button
    onclick={handleFileClick}
    class="flex items-center gap-1.5 w-full text-left text-sm transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
    style="min-height: 36px; padding-left: {paddingLeft}px; padding-right: 8px;
           color: {$activeFile === entry.path ? 'var(--accent)' : 'var(--text)'};
           background: {$activeFile === entry.path ? 'var(--accent-dim)' : 'transparent'};"
    aria-current={$activeFile === entry.path ? 'page' : undefined}
  >
    {#if entry.name.endsWith('.canvas')}
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; color: var(--accent);">
        <rect x="2" y="2" width="20" height="20" rx="2"/>
        <circle cx="8" cy="8" r="1.5"/><circle cx="16" cy="16" r="1.5"/>
        <path d="M10 8h4a2 2 0 0 1 2 2v4"/>
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; opacity: 0.7;">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    {/if}
    <span class="truncate">{entry.name}</span>
  </button>
{/if}
