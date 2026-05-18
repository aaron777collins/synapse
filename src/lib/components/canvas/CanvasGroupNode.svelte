<script lang="ts">
  import type { CanvasGroupNode as GroupNodeType } from '$lib/types/canvas';
  import { resolveColor, MIN_NODE_WIDTH, MIN_NODE_HEIGHT } from '$lib/types/canvas';
  import {
    selectedNodeIds,
    editingNodeId,
    updateNode,
    pushUndo,
    canvasTransform,
  } from '$lib/stores/canvas';
  import { theme } from '$lib/stores/ui';

  let {
    node,
    oncontextmenu,
    ondragstart,
  }: {
    node: GroupNodeType;
    oncontextmenu?: (e: MouseEvent) => void;
    ondragstart?: (e: MouseEvent, nodeId: string) => void;
  } = $props();

  const isSelected = $derived($selectedNodeIds.has(node.id));
  const isEditing = $derived($editingNodeId === node.id);
  const isDark = $derived($theme === 'dark');
  const borderColor = $derived(resolveColor(node.color, isDark));

  let labelInput: HTMLInputElement | undefined = $state(undefined);

  $effect(() => {
    if (isEditing && labelInput) {
      requestAnimationFrame(() => labelInput?.focus());
    }
  });

  function handleHeaderMouseDown(e: MouseEvent) {
    if (isEditing) return;
    e.stopPropagation();
    ondragstart?.(e, node.id);
  }

  function handleDblClick(e: MouseEvent) {
    e.stopPropagation();
    editingNodeId.set(node.id);
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    oncontextmenu?.(e);
  }

  function handleLabelBlur() {
    editingNodeId.set(null);
    pushUndo();
  }

  function handleLabelKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === 'Escape') {
      editingNodeId.set(null);
      pushUndo();
    }
  }

  function handleLabelInput(e: Event) {
    updateNode(node.id, { label: (e.target as HTMLInputElement).value });
  }

  function startResize(e: MouseEvent, corner: string) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = node.width;
    const startH = node.height;
    const startNX = node.x;
    const startNY = node.y;
    const k = $canvasTransform.k;

    pushUndo();

    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startX) / k;
      const dy = (ev.clientY - startY) / k;
      let newX = startNX, newY = startNY, newW = startW, newH = startH;
      if (corner.includes('r')) newW = Math.max(MIN_NODE_WIDTH, startW + dx);
      if (corner.includes('l')) { newW = Math.max(MIN_NODE_WIDTH, startW - dx); newX = startNX + startW - newW; }
      if (corner.includes('b')) newH = Math.max(MIN_NODE_HEIGHT, startH + dy);
      if (corner.includes('t')) { newH = Math.max(MIN_NODE_HEIGHT, startH - dy); newY = startNY + startH - newH; }
      updateNode(node.id, { x: newX, y: newY, width: newW, height: newH });
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="canvas-group"
  class:selected={isSelected}
  style="
    left: {node.x}px;
    top: {node.y}px;
    width: {node.width}px;
    height: {node.height}px;
    {borderColor ? `--group-accent: ${borderColor};` : ''}
  "
  oncontextmenu={handleContextMenu}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="group-header"
    onmousedown={handleHeaderMouseDown}
    ondblclick={handleDblClick}
  >
    {#if isEditing}
      <input
        bind:this={labelInput}
        type="text"
        value={node.label ?? ''}
        oninput={handleLabelInput}
        onblur={handleLabelBlur}
        onkeydown={handleLabelKeydown}
        class="group-label-input"
        spellcheck="false"
      />
    {:else}
      <span class="group-label">{node.label || 'Group'}</span>
    {/if}
  </div>

  {#if isSelected}
    <div class="resize-handle rh-t" onmousedown={(e) => startResize(e, 't')}></div>
    <div class="resize-handle rh-r" onmousedown={(e) => startResize(e, 'r')}></div>
    <div class="resize-handle rh-b" onmousedown={(e) => startResize(e, 'b')}></div>
    <div class="resize-handle rh-l" onmousedown={(e) => startResize(e, 'l')}></div>
    <div class="resize-handle rh-tl" onmousedown={(e) => startResize(e, 'tl')}></div>
    <div class="resize-handle rh-tr" onmousedown={(e) => startResize(e, 'tr')}></div>
    <div class="resize-handle rh-bl" onmousedown={(e) => startResize(e, 'bl')}></div>
    <div class="resize-handle rh-br" onmousedown={(e) => startResize(e, 'br')}></div>
  {/if}
</div>

<style>
  .canvas-group {
    position: absolute;
    border: 2px dashed color-mix(in srgb, var(--group-accent, var(--canvas-card-border)) 70%, transparent);
    border-radius: 10px;
    background: color-mix(in srgb, var(--group-accent, var(--accent)) 5%, transparent);
    pointer-events: none;
  }

  .canvas-group.selected {
    border-color: var(--group-accent, var(--accent));
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--group-accent, var(--accent)) 20%, transparent);
  }

  .group-header {
    pointer-events: auto;
    padding: 6px 12px;
    cursor: grab;
    min-height: 28px;
    display: flex;
    align-items: center;
  }

  .group-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--group-accent, var(--text-muted));
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .group-label-input {
    background: transparent;
    border: none;
    outline: none;
    font-size: 13px;
    font-weight: 600;
    color: var(--group-accent, var(--text));
    text-transform: uppercase;
    letter-spacing: 0.5px;
    width: 100%;
  }

  .resize-handle {
    position: absolute;
    z-index: 5;
    pointer-events: auto;
  }
  .rh-t, .rh-b { left: 8px; right: 8px; height: 6px; cursor: ns-resize; }
  .rh-l, .rh-r { top: 8px; bottom: 8px; width: 6px; cursor: ew-resize; }
  .rh-t { top: -3px; } .rh-b { bottom: -3px; }
  .rh-l { left: -3px; } .rh-r { right: -3px; }
  .rh-tl, .rh-tr, .rh-bl, .rh-br { width: 10px; height: 10px; }
  .rh-tl { top: -4px; left: -4px; cursor: nwse-resize; }
  .rh-tr { top: -4px; right: -4px; cursor: nesw-resize; }
  .rh-bl { bottom: -4px; left: -4px; cursor: nesw-resize; }
  .rh-br { bottom: -4px; right: -4px; cursor: nwse-resize; }
</style>
