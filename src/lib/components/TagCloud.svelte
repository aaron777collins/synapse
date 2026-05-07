<script lang="ts">
  import type { TagEntry } from "$lib/services/api";
  import { activeTag } from "$lib/stores/tags";
  import { selectTag, clearTag } from "$lib/stores/tags";

  let { tags }: { tags: TagEntry[] } = $props();

  // The tag with the highest count sets the scale for relative sizing
  const maxCount = $derived(tags.length > 0 ? Math.max(...tags.map((t) => t.count)) : 1);

  /**
   * Map a tag's count to a Tailwind font-size class.
   * Ratio >= 0.75 → large, >= 0.4 → base, else small.
   */
  function sizeClass(count: number): string {
    const ratio = count / maxCount;
    if (ratio >= 0.75) return "text-lg";
    if (ratio >= 0.4) return "text-base";
    return "text-sm";
  }

  function handleClick(tag: string) {
    if ($activeTag === tag) {
      // Clicking the active tag deselects it
      clearTag();
    } else {
      selectTag(tag);
    }
  }
</script>

<div class="flex flex-wrap gap-1.5 px-4 py-2">
  {#each tags as entry (entry.tag)}
    {@const isActive = $activeTag === entry.tag}
    <button
      onclick={() => handleClick(entry.tag)}
      class="{sizeClass(entry.count)} rounded-full px-2.5 py-0.5 font-medium transition-colors"
      style={isActive
        ? "background: var(--accent); color: #fff;"
        : "background: var(--accent-dim); color: var(--accent);"}
      title="#{entry.tag} ({entry.count})"
      aria-pressed={isActive}
    >
      #{entry.tag}
      <span
        class="text-xs opacity-75 ml-0.5"
      >
        {entry.count}
      </span>
    </button>
  {/each}
</div>
