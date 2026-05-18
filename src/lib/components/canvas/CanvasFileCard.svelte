<script lang="ts">
  import type { CanvasFileNode } from '$lib/types/canvas';
  import { resolveColor, MIN_NODE_WIDTH, MIN_NODE_HEIGHT } from '$lib/types/canvas';
  import {
    selectedNodeIds,
    updateNode,
    pushUndo,
    canvasTransform,
  } from '$lib/stores/canvas';
  import { openFile } from '$lib/stores/vault';
  import { theme } from '$lib/stores/ui';

  let {
    node,
    oncontextmenu,
    ondragstart,
    onconnectstart,
  }: {
    node: CanvasFileNode;
    oncontextmenu?: (e: MouseEvent) => void;
    ondragstart?: (e: MouseEvent, nodeId: string) => void;
    onconnectstart?: (e: MouseEvent, nodeId: string, side: 'top' | 'right' | 'bottom' | 'left') => void;
  } = $props();

  const isSelected = $derived($selectedNodeIds.has(node.id));
  const isDark = $derived($theme === 'dark');
  const borderColor = $derived(resolveColor(node.color, isDark));

  const fileName = $derived.by(() => {
    const parts = node.file.split('/');
    return (parts[parts.length - 1] ?? '').replace(/\.md$/i, '');
  });

  function handleMouseDown(e: MouseEvent) {
    e.stopPropagation();
    ondragstart?.(e, node.id);
  }

  function handleDblClick(e: MouseEvent) {
    e.stopPropagation();
    openFile(node.file);
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    oncontextmenu?.(e);
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

  function handleAnchorMouseDown(e: MouseEvent, side: 'top' | 'right' | 'bottom' | 'left') {
    e.stopPropagation();
    e.preventDefault();
    onconnectstart?.(e, node.id, side);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="canvas-card canvas-file-card"
  class:selected={isSelected}
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
  <div class="file-card-inner">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; color: var(--accent);">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
    <div class="file-card-info">
      <span class="file-card-name">{fileName}</span>
      <span class="file-card-path">{node.file}</span>
    </div>
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
  }

  .canvas-card:hover {
    border-color: color-mix(in srgb, var(--accent) 40%, var(--canvas-card-border));
  }

  .canvas-card.selected {
    border-color: var(--card-accent, var(--accent));
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--card-accent, var(--accent)) 30%, transparent),
                0 4px 16px rgba(0,0,0,0.2);
  }

  .canvas-card[style*="--card-accent"] {
    border-color: var(--card-accent);
  }

  .file-card-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    height: 100%;
    overflow: hidden;
    border-radius: 7px;
  }

  .file-card-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
  }

  .file-card-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-card-path {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .resize-handle {
    position: absolute;
    z-index: 5;
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

  .canvas-card:hover .conn-anchor { opacity: 0.8; transform: scale(1); }
  .conn-anchor:hover { opacity: 1 !important; transform: scale(1.2) !important; }

  .anchor-top    { top: -6px; left: 50%; margin-left: -6px; }
  .anchor-bottom { bottom: -6px; left: 50%; margin-left: -6px; }
  .anchor-left   { left: -6px; top: 50%; margin-top: -6px; }
  .anchor-right  { right: -6px; top: 50%; margin-top: -6px; }
</style>
