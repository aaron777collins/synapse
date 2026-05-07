<script lang="ts">
  let {
    x = 0,
    y = 0,
    items = [],
    open = $bindable(false)
  }: {
    x: number;
    y: number;
    items: { label: string; icon?: string; danger?: boolean; action: () => void }[];
    open: boolean;
  } = $props();

  function handleClick(action: () => void) {
    action();
    open = false;
  }

  function handleClickOutside(e: MouseEvent) {
    if (e.target === e.currentTarget) open = false;
  }

  // Close the menu when Escape is pressed, regardless of where focus is
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") open = false;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[200]"
    onclick={handleClickOutside}
    oncontextmenu={(e) => { e.preventDefault(); open = false; }}
  >
    <div
      class="absolute rounded-lg shadow-xl py-1 min-w-[160px] border animate-fade-in-scale"
      style="
        left: {Math.min(x, window.innerWidth - 180)}px;
        top: {Math.min(y, window.innerHeight - items.length * 36 - 20)}px;
        background: var(--surface);
        border-color: var(--border);
      "
      role="menu"
    >
      {#each items as item}
        <button
          onclick={() => handleClick(item.action)}
          class="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-[var(--surface-hover)]"
          style="color: {item.danger ? '#ef4444' : 'var(--text)'};"
          role="menuitem"
        >
          {#if item.icon === 'rename'}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          {:else if item.icon === 'delete'}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          {:else if item.icon === 'open'}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {/if}
          {item.label}
        </button>
      {/each}
    </div>
  </div>
{/if}
