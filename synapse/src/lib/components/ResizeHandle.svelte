<script lang="ts">
  import { sidebarWidth } from "$lib/stores/ui";

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 500;

  let dragging = $state(false);

  function onPointerDown(e: PointerEvent) {
    // Only respond to primary button (left click)
    if (e.button !== 0) return;
    e.preventDefault();

    dragging = true;
    // Prevent text selection during the drag anywhere on the page
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const startX = e.clientX;
    const startWidth = $sidebarWidth;

    function onPointerMove(ev: PointerEvent) {
      const delta = ev.clientX - startX;
      const proposed = startWidth + delta;
      sidebarWidth.set(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, proposed)));
    }

    function onPointerUp() {
      dragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    }

    // Attach to document so fast mouse movements never "escape" the handle
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }
</script>

<!--
  The visible 4px bar sits inside an 8px hit-area container so the drag
  target is easier to grab without looking precise.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="resize-handle"
  class:dragging
  onpointerdown={onPointerDown}
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize sidebar"
></div>

<style>
  .resize-handle {
    /* 8px total hit area — the 4px visible bar is rendered via the pseudo-element */
    width: 8px;
    flex-shrink: 0;
    position: relative;
    cursor: col-resize;
    z-index: 10;
  }

  /* The actual visible 4px bar, centered inside the 8px hit area */
  .resize-handle::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 2px;
    width: 4px;
    background: var(--border);
    transition: background 0.15s ease;
  }

  .resize-handle:hover::after,
  .resize-handle.dragging::after {
    background: var(--accent);
  }
</style>
