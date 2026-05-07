<script lang="ts">
  import { onMount } from "svelte";
  import { allTags, activeTag, activeTagFiles, loadTags, clearTag } from "$lib/stores/tags";
  import { openFile } from "$lib/stores/vault";
  import { basename, stripExtension } from "$lib/utils/paths";
  import TagCloud from "./TagCloud.svelte";

  // Collapsed/expanded state is local — no shared store needed for the panel header
  let expanded = $state(true);

  function toggle() {
    expanded = !expanded;
  }

  onMount(() => {
    loadTags();
  });
</script>

<div
  class="shrink-0 border-t text-sm"
  style="background: var(--surface); border-color: var(--border);"
>
  <!-- Section header -->
  <button
    onclick={toggle}
    class="w-full flex items-center justify-between px-4 py-2 text-left transition-colors hover:bg-[var(--surface-hover)]"
    style="color: var(--text);"
    aria-expanded={expanded}
  >
    <span class="font-medium flex items-center gap-2">
      Tags
      {#if $allTags.length > 0}
        <span
          class="text-xs rounded-full px-1.5 py-0.5 font-semibold"
          style="background: var(--accent-dim); color: var(--accent);"
        >
          {$allTags.length}
        </span>
      {/if}
    </span>

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
      class="transition-transform"
      style="transform: rotate({expanded ? '0deg' : '-90deg'}); color: var(--text-muted);"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>

  {#if expanded}
    {#if $allTags.length === 0}
      <p class="px-4 py-3 text-xs" style="color: var(--text-muted);">
        No tags yet. Use #tag in your notes.
      </p>
    {:else}
      <!-- Tag cloud -->
      <TagCloud tags={$allTags} />

      <!-- Per-tag file list shown when a tag is selected -->
      {#if $activeTag}
        <div class="border-t" style="border-color: var(--border);">
          <!-- Active tag header: py-2 and stronger accent color make it feel intentional -->
          <div class="flex items-center justify-between px-4 py-2">
            <span class="text-xs font-semibold flex items-center gap-1" style="color: var(--accent);">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
              </svg>
              {$activeTag}
            </span>
            <button
              onclick={clearTag}
              class="text-xs px-2 py-0.5 rounded transition-colors hover:bg-[var(--surface-hover)]"
              style="color: var(--text-muted);"
            >
              Clear
            </button>
          </div>

          {#if $activeTagFiles.length === 0}
            <p class="px-4 py-2 text-xs" style="color: var(--text-muted);">No files found.</p>
          {:else}
            <!-- File items use the same mx-1 / rounded-md pattern as FileTreeNode -->
            <ul class="pb-2 overflow-y-auto" style="max-height: 160px;">
              {#each $activeTagFiles as file (file.path)}
                <li class="mx-1">
                  <button
                    onclick={() => openFile(file.path)}
                    class="w-full text-left px-3 py-1.5 text-xs truncate rounded-md transition-colors hover:bg-[var(--surface-hover)]"
                    style="color: var(--text);"
                    title={file.path}
                  >
                    {stripExtension(basename(file.path))}
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
    {/if}
  {/if}
</div>
