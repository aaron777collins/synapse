<script lang="ts">
  import { splitRatio } from "$lib/stores/panes";

  let dragging = $state(false);
  let containerEl: HTMLElement | null = null;

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();

    dragging = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    containerEl = (e.currentTarget as HTMLElement).parentElement;

    function onPointerMove(ev: PointerEvent) {
      if (!containerEl) return;
      const rect = containerEl.getBoundingClientRect();
      const ratio = (ev.clientX - rect.left) / rect.width;
      splitRatio.set(Math.min(0.8, Math.max(0.2, ratio)));
    }

    function onPointerUp() {
      dragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    }

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="split-handle"
  class:dragging
  onpointerdown={onPointerDown}
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize split panes"
></div>

<style>
  .split-handle {
    width: 6px;
    flex-shrink: 0;
    position: relative;
    cursor: col-resize;
    z-index: 10;
  }

  .split-handle::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 1px;
    width: 4px;
    background: var(--border);
    transition: background 0.15s ease;
  }

  .split-handle:hover::after,
  .split-handle.dragging::after {
    background: var(--accent);
  }
</style>
