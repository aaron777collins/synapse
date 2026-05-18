<script lang="ts">
  import type { CanvasTextNode } from '$lib/types/canvas';
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
    onconnectstart,
  }: {
    node: CanvasTextNode;
    oncontextmenu?: (e: MouseEvent) => void;
    ondragstart?: (e: MouseEvent, nodeId: string) => void;
    onconnectstart?: (e: MouseEvent, nodeId: string, side: 'top' | 'right' | 'bottom' | 'left') => void;
  } = $props();

  const isSelected = $derived($selectedNodeIds.has(node.id));
  const isEditing = $derived($editingNodeId === node.id);
  const isDark = $derived($theme === 'dark');
  const borderColor = $derived(resolveColor(node.color, isDark));

  let textareaEl: HTMLTextAreaElement | undefined = $state(undefined);

  $effect(() => {
    if (isEditing && textareaEl) {
      requestAnimationFrame(() => textareaEl?.focus());
    }
  });

  function handleMouseDown(e: MouseEvent) {
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

  function handleTextChange(e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    updateNode(node.id, { text: val });
  }

  function handleTextBlur() {
    editingNodeId.set(null);
    pushUndo();
  }

  function handleTextKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      editingNodeId.set(null);
      pushUndo();
    }
    e.stopPropagation();
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

      let newX = startNX;
      let newY = startNY;
      let newW = startW;
      let newH = startH;

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

  function handleAnchorMouseDown(e: MouseEvent, side: 'top' | 'right' | 'bottom' | 'left') {
    e.stopPropagation();
    e.preventDefault();
    onconnectstart?.(e, node.id, side);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="canvas-card canvas-text-card"
  class:selected={isSelected}
  class:editing={isEditing}
  style="
    left: {node.x}px;
    top: {node.y}px;
    width: {node.width}px;
    height: {node.height}px;
    {borderColor ? `--card-accent: ${borderColor};` : ''}
  "
  onmousedown={handleMouseDown}
  ondblclick={handleDblClick}
  oncontextmenu={handleContextMenu}
>
  <div class="canvas-card-body">
    {#if isEditing}
      <textarea
        bind:this={textareaEl}
        value={node.text}
        oninput={handleTextChange}
        onblur={handleTextBlur}
        onkeydown={handleTextKeydown}
        class="canvas-card-textarea"
        spellcheck="false"
      ></textarea>
    {:else}
      <div class="canvas-card-content">
      {#each node.text.split('\n') as line}
        <p>{line || ' '}</p>
      {/each}
      </div>
    {/if}
  </div>

  {#if isSelected && !isEditing}
    <div class="resize-handle rh-t" onmousedown={(e) => startResize(e, 't')}></div>
    <div class="resize-handle rh-r" onmousedown={(e) => startResize(e, 'r')}></div>
    <div class="resize-handle rh-b" onmousedown={(e) => startResize(e, 'b')}></div>
    <div class="resize-handle rh-l" onmousedown={(e) => startResize(e, 'l')}></div>
    <div class="resize-handle rh-tl" onmousedown={(e) => startResize(e, 'tl')}></div>
    <div class="resize-handle rh-tr" onmousedown={(e) => startResize(e, 'tr')}></div>
    <div class="resize-handle rh-bl" onmousedown={(e) => startResize(e, 'bl')}></div>
    <div class="resize-handle rh-br" onmousedown={(e) => startResize(e, 'br')}></div>
  {/if}

  <div class="conn-anchor anchor-top" onmousedown={(e) => handleAnchorMouseDown(e, 'top')}></div>
  <div class="conn-anchor anchor-right" onmousedown={(e) => handleAnchorMouseDown(e, 'right')}></div>
  <div class="conn-anchor anchor-bottom" onmousedown={(e) => handleAnchorMouseDown(e, 'bottom')}></div>
  <div class="conn-anchor anchor-left" onmousedown={(e) => handleAnchorMouseDown(e, 'left')}></div>
</div>

<style>
  .canvas-card {
    position: absolute;
    background: var(--canvas-card-bg);
    border: 1.5px solid var(--canvas-card-border);
    border-radius: 8px;
    overflow: visible;
    cursor: grab;
    transition: box-shadow 0.15s, border-color 0.15s;
    display: flex;
    flex-direction: column;
  }

  .canvas-card:hover {
    border-color: color-mix(in srgb, var(--accent) 40%, var(--canvas-card-border));
  }

  .canvas-card.selected {
    border-color: var(--card-accent, var(--accent));
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--card-accent, var(--accent)) 30%, transparent),
                0 4px 16px rgba(0,0,0,0.2);
  }

  .canvas-card.editing {
    cursor: text;
  }

  .canvas-card[style*="--card-accent"] {
    border-color: var(--card-accent);
  }

  .canvas-card-body {
    overflow: hidden;
    border-radius: 7px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .canvas-card-content {
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text);
    overflow-y: auto;
    flex: 1;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .canvas-card-content p {
    margin: 0 0 2px;
  }

  .canvas-card-textarea {
    width: 100%;
    height: 100%;
    resize: none;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.5;
    padding: 12px 14px;
    flex: 1;
  }

  .resize-handle {
    position: absolute;
    z-index: 5;
  }
  .rh-t, .rh-b { left: 8px; right: 8px; height: 6px; cursor: ns-resize; }
  .rh-l, .rh-r { top: 8px; bottom: 8px; width: 6px; cursor: ew-resize; }
  .rh-t { top: -3px; }
  .rh-b { bottom: -3px; }
  .rh-l { left: -3px; }
  .rh-r { right: -3px; }
  .rh-tl, .rh-tr, .rh-bl, .rh-br { width: 10px; height: 10px; }
  .rh-tl { top: -4px; left: -4px; cursor: nwse-resize; }
  .rh-tr { top: -4px; right: -4px; cursor: nesw-resize; }
  .rh-bl { bottom: -4px; left: -4px; cursor: nesw-resize; }
  .rh-br { bottom: -4px; right: -4px; cursor: nwse-resize; }

  .conn-anchor {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0;
    transition: opacity 0.15s, transform 0.15s;
    cursor: crosshair;
    z-index: 6;
    transform: scale(0.6);
  }

  .canvas-card:hover .conn-anchor {
    opacity: 0.8;
    transform: scale(1);
  }

  .conn-anchor:hover {
    opacity: 1 !important;
    transform: scale(1.2) !important;
  }

  .anchor-top    { top: -6px; left: 50%; margin-left: -6px; }
  .anchor-bottom { bottom: -6px; left: 50%; margin-left: -6px; }
  .anchor-left   { left: -6px; top: 50%; margin-top: -6px; }
  .anchor-right  { right: -6px; top: 50%; margin-top: -6px; }
</style>
