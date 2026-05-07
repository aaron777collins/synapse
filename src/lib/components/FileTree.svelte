<script lang="ts">
  import { onMount } from "svelte";
  import { loadDir, childrenByDir } from "$lib/stores/vault";
  import FileTreeNode from "./FileTreeNode.svelte";

  onMount(() => {
    loadDir("");
  });
</script>

<div class="flex-1 overflow-y-auto" style="color: var(--text);">
  {#if $childrenByDir.has("") && $childrenByDir.get("")!.length > 0}
    {#each $childrenByDir.get("")! as entry (entry.path)}
      <FileTreeNode {entry} depth={0} />
    {/each}
  {:else if $childrenByDir.has("")}
    <!-- Vault is loaded but empty -->
    <p class="px-4 py-6 text-xs text-center" style="color: var(--text-muted);">
      No notes yet. Create one to get started.
    </p>
  {/if}
</div>
