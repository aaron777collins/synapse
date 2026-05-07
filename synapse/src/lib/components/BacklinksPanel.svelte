<script lang="ts">
  import { onDestroy } from "svelte";
  import { api, type BacklinkEntry } from "$lib/services/api";
  import { activeFile, navigateToLink } from "$lib/stores/vault";
  import { backlinksOpen } from "$lib/stores/ui";
  import { basename, stripExtension } from "$lib/utils/paths";

  let backlinks = $state<BacklinkEntry[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  const unsubscribe = activeFile.subscribe((file) => {
    if (!file) {
      backlinks = [];
      loading = false;
      error = null;
      return;
    }

    loading = true;
    error = null;

    api.links
      .backlinks(file)
      .then((result) => {
        backlinks = result;
      })
      .catch((e: unknown) => {
        error = e instanceof Error ? e.message : "Failed to load backlinks";
        backlinks = [];
      })
      .finally(() => {
        loading = false;
      });
  });

  onDestroy(unsubscribe);

  function toggle() {
    backlinksOpen.update((v) => !v);
  }

  /**
   * Highlight [[...]] patterns inside a context string.
   * Returns an array of {text, isLink} segments for inline rendering.
   */
  function parseContext(context: string): { text: string; isLink: boolean }[] {
    const segments: { text: string; isLink: boolean }[] = [];
    const re = /\[\[([^\]]+)\]\]/g;
    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(context)) !== null) {
      if (m.index > last) {
        segments.push({ text: context.slice(last, m.index), isLink: false });
      }
      segments.push({ text: m[0], isLink: true });
      last = m.index + m[0].length;
    }

    if (last < context.length) {
      segments.push({ text: context.slice(last), isLink: false });
    }

    return segments;
  }

  function handleSourceClick(source: string) {
    // Navigate using the note name without directory or extension
    navigateToLink(stripExtension(basename(source)));
  }
</script>

{#if $activeFile}
  <div
    class="shrink-0 border-t text-sm"
    style="background: var(--surface); border-color: var(--border);"
  >
    <!-- Header row -->
    <button
      onclick={toggle}
      class="w-full flex items-center justify-between px-4 py-2 text-left transition-colors hover:bg-[var(--surface-hover)]"
      style="color: var(--text);"
      aria-expanded={$backlinksOpen}
    >
      <span class="font-medium flex items-center gap-2">
        Backlinks
        {#if backlinks.length > 0}
          <!-- Slightly larger badge so the count reads clearly at small sizes -->
          <span
            class="text-xs rounded-full px-2 py-0.5 font-semibold"
            style="background: var(--accent-dim); color: var(--accent);"
          >
            {backlinks.length}
          </span>
        {/if}
      </span>

      <!-- Chevron rotates when expanded -->
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
        style="transform: rotate({$backlinksOpen ? '0deg' : '-90deg'}); color: var(--text-muted);"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    {#if $backlinksOpen}
      <!-- max-height increased to 240px for more visible context -->
      <div class="overflow-y-auto" style="max-height: 240px;">
        {#if loading}
          <p class="px-4 py-2 text-xs" style="color: var(--text-muted);">Loading…</p>
        {:else if error}
          <p class="px-4 py-2 text-xs" style="color: #ef4444;">{error}</p>
        {:else if backlinks.length === 0}
          <p class="px-4 py-3 text-xs" style="color: var(--text-muted);">
            No other notes link here yet.
          </p>
        {:else}
          <!-- py-2 gives the list breathing room at top and bottom -->
          <ul class="py-2">
            {#each backlinks as link (link.source + link.lineNumber)}
              <!-- hover background + rounded + mx-1 mirrors FileTreeNode treatment -->
              <li class="mx-1 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--surface-hover)]">
                <!-- Source note name — clicking opens it -->
                <button
                  onclick={() => handleSourceClick(link.source)}
                  class="block text-xs font-medium hover:underline truncate w-full text-left"
                  style="color: var(--accent);"
                  title={link.source}
                >
                  {stripExtension(basename(link.source))}
                </button>

                <!-- Context line with [[...]] highlighted -->
                <p
                  class="text-xs mt-0.5 truncate"
                  style="color: var(--text-muted);"
                  title={link.context}
                >
                  {#each parseContext(link.context) as seg (seg.text + seg.isLink)}
                    {#if seg.isLink}
                      <span style="color: var(--accent);">{seg.text}</span>
                    {:else}
                      {seg.text}
                    {/if}
                  {/each}
                </p>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
{/if}
