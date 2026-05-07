<script lang="ts">
  import { onMount } from "svelte";
  import { loadDir, childrenByDir } from "$lib/stores/vault";
  import FileTreeNode from "./FileTreeNode.svelte";

  onMount(() => {
    loadDir("");
  });
</script>

<div class="flex-1 overflow-y-auto py-1" style="color: var(--text);">
  {#if $childrenByDir.has("") && $childrenByDir.get("")!.length > 0}
    {#each $childrenByDir.get("")! as entry (entry.path)}
      <FileTreeNode {entry} depth={0} />
    {/each}
  {:else if $childrenByDir.has("")}
    <!-- Vault is loaded but empty — friendly nudge with an icon -->
    <div class="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="color: var(--text-muted); opacity: 0.5;"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="11" x2="12" y2="17"/>
        <line x1="9" y1="14" x2="15" y2="14"/>
      </svg>
      <p class="text-sm font-medium" style="color: var(--text-muted);">No notes yet</p>
      <p class="text-xs" style="color: var(--text-muted); opacity: 0.7;">Create one to get started</p>
    </div>
  {/if}
</div>
