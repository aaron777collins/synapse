<script lang="ts">
  import { allFiles } from '$lib/stores/vault';
  import { fuzzySort } from '$lib/services/fuzzy';

  let {
    open = $bindable(false),
    onselect,
  }: {
    open: boolean;
    onselect: (path: string) => void;
  } = $props();

  let query = $state('');
  let selectedIndex = $state(0);
  let inputEl: HTMLInputElement | undefined = $state(undefined);

  function basename(p: string) { return p.split('/').pop() ?? p; }
  function stripExt(n: string) { return n.replace(/\.[^/.]+$/, ''); }

  const results = $derived.by(() => {
    const files = $allFiles.filter(f => f.endsWith('.md'));
    if (!query.trim()) return files.slice(0, 15);
    const scored = fuzzySort(query, files.map(p => stripExt(basename(p))));
    const map = new Map<string, string>();
    for (const p of files) map.set(stripExt(basename(p)), p);
    return scored.map(n => map.get(n)).filter((p): p is string => !!p);
  });

  $effect(() => { void results; selectedIndex = 0; });
  $effect(() => {
    if (open && inputEl) requestAnimationFrame(() => inputEl?.focus());
    if (!open) query = '';
  });

  function close() { open = false; }
  function pick(p: string) { onselect(p); close(); }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, results.length - 1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); return; }
    if (e.key === 'Enter') { const c = results[selectedIndex]; if (c) pick(c); return; }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4"
    style="padding-top: clamp(4rem, 18vh, 10rem);"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
  >
    <div class="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden" style="background: var(--surface); border: 1px solid var(--border);">
      <div class="px-4 py-3" style="border-bottom: 1px solid var(--border);">
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          placeholder="Pick a note to embed..."
          onkeydown={handleKeydown}
          class="w-full bg-transparent text-sm outline-none"
          style="color: var(--text);"
          autocomplete="off"
          spellcheck="false"
        />
      </div>
      <ul class="max-h-80 overflow-y-auto" role="listbox">
        {#if results.length === 0}
          <li class="px-4 py-6 text-sm text-center" style="color: var(--text-muted);">No notes found.</li>
        {:else}
          {#each results as path, i (path)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <li
              role="option"
              aria-selected={i === selectedIndex}
              onclick={() => pick(path)}
              class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
              style={i === selectedIndex ? 'background: color-mix(in srgb, var(--accent) 15%, transparent);' : ''}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); flex-shrink: 0;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium truncate" style="color: var(--text);">{stripExt(basename(path))}</span>
                <span class="text-xs truncate" style="color: var(--text-muted);">{path}</span>
              </div>
            </li>
          {/each}
        {/if}
      </ul>
      <div class="flex gap-4 px-4 py-2 text-xs" style="color: var(--text-muted); border-top: 1px solid var(--border);">
        <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
      </div>
    </div>
  </div>
{/if}
