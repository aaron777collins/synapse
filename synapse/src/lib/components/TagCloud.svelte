<script lang="ts">
  import type { TagEntry } from "$lib/services/api";
  import { activeTag } from "$lib/stores/tags";
  import { selectTag, clearTag } from "$lib/stores/tags";
  import { openTagNote } from "$lib/stores/tagNote";

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
      // Clicking the active tag deselects it — no tag note to open
      clearTag();
    } else {
      selectTag(tag);
      // Opening the tag note view is a side-effect of selecting a tag;
      // the virtual tab appears alongside the file list in the sidebar.
      openTagNote(tag);
    }
  }
</script>

<!-- py-3 and gap-2 give the cloud more air; hover scale adds interactivity feedback -->
<div class="flex flex-wrap gap-2 px-4 py-3">
  {#each tags as entry (entry.tag)}
    {@const isActive = $activeTag === entry.tag}
    <button
      onclick={() => handleClick(entry.tag)}
      class="{sizeClass(entry.count)} rounded-full px-2.5 py-0.5 font-medium transition-all hover:opacity-80 hover:scale-105 active:scale-95"
      style={isActive
        ? "background: var(--accent); color: #fff;"
        : "background: var(--accent-dim); color: var(--accent);"}
      title="#{entry.tag} ({entry.count})"
      aria-pressed={isActive}
    >
      #{entry.tag}
      <!-- Count badge: smaller font + more transparent so the tag name stays primary -->
      <span
        class="ml-0.5 opacity-60"
        style="font-size: 0.65em; font-weight: 500;"
      >
        {entry.count}
      </span>
    </button>
  {/each}
</div>
