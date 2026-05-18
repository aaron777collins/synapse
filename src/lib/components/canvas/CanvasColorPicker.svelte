<script lang="ts">
  import { CANVAS_COLORS, type CanvasColorPreset } from '$lib/types/canvas';
  import { theme } from '$lib/stores/ui';

  let {
    x,
    y,
    currentColor,
    onselect,
    onclose,
  }: {
    x: number;
    y: number;
    currentColor?: string;
    onselect: (color: string | undefined) => void;
    onclose: () => void;
  } = $props();

  const isDark = $derived($theme === 'dark');
  const presets = Object.entries(CANVAS_COLORS) as [CanvasColorPreset, typeof CANVAS_COLORS['1']][];
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="color-picker-backdrop" onclick={onclose}>
  <div
    class="color-picker"
    style="left: {x}px; top: {y}px;"
    onclick={(e) => e.stopPropagation()}
  >
    {#each presets as [key, color]}
      <button
        class="color-swatch"
        class:active={currentColor === key}
        style="background: {isDark ? color.dark : color.light};"
        title={color.name}
        onclick={() => onselect(key)}
      ></button>
    {/each}
    <button
      class="color-swatch clear-swatch"
      class:active={!currentColor}
      title="Default"
      onclick={() => onselect(undefined)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .color-picker-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
  }

  .color-picker {
    position: fixed;
    display: flex;
    gap: 6px;
    padding: 8px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }

  .color-swatch {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.1s, border-color 0.1s;
  }

  .color-swatch:hover {
    transform: scale(1.15);
  }

  .color-swatch.active {
    border-color: var(--text);
    transform: scale(1.1);
  }

  .clear-swatch {
    background: var(--surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }
</style>
