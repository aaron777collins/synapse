<script lang="ts">
  import {
    type CanvasTextNode,
    type CanvasFileNode,
    type CanvasGroupNode as GroupType,
    type CanvasEdge as EdgeType,
    type CanvasNodeBase,
    type CanvasSide,
    generateId,
    snapToGrid,
    getAnchorPoint,
    bestSide,
    DEFAULT_TEXT_NODE,
    DEFAULT_FILE_NODE,
    DEFAULT_GROUP_NODE,
  } from '$lib/types/canvas';
  import {
    canvasData,
    canvasTransform,
    selectedNodeIds,
    selectedEdgeIds,
    editingNodeId,
    drawingEdge,
    addNode,
    addEdge,
    deleteSelected,
    clearSelection,
    selectAll,
    moveSelectedNodes,
    pushUndo,
    bringToFront,
    setNodeColor,
    setEdgeColor,
    updateEdge,
    groupSelected,
    undo,
    redo,
    saveCanvas,
    resetView,
  } from '$lib/stores/canvas';
  import CanvasTextCard from './CanvasTextCard.svelte';
  import CanvasFileCard from './CanvasFileCard.svelte';
  import CanvasGroupNode from './CanvasGroupNode.svelte';
  import CanvasEdge from './CanvasEdge.svelte';
  import CanvasToolbar from './CanvasToolbar.svelte';
  import CanvasCreationBar from './CanvasCreationBar.svelte';
  import CanvasContextMenu from './CanvasContextMenu.svelte';
  import CanvasColorPicker from './CanvasColorPicker.svelte';
  import CanvasNotePicker from './CanvasNotePicker.svelte';
  import type { MenuAction } from './CanvasContextMenu.svelte';

  let containerEl: HTMLDivElement | undefined = $state(undefined);

  let isPanning = $state(false);
  let panStart = { x: 0, y: 0 };

  let isDragging = $state(false);
  let dragNodeId: string | null = $state(null);
  let dragStart = { wx: 0, wy: 0 };
  let didMove = false;

  let boxSelecting = $state(false);
  let boxStart = { x: 0, y: 0 };
  let boxEnd = $state({ x: 0, y: 0 });

  let ctxMenu = $state<{ x: number; y: number; target: 'canvas' | 'node' | 'edge' } | null>(null);
  let ctxWorldPos = { x: 0, y: 0 };

  let colorPicker = $state<{ x: number; y: number; target: 'node' | 'edge' } | null>(null);

  let notePickerOpen = $state(false);
  let notePickerWorldPos = { x: 0, y: 0 };

  const nodesById = $derived(new Map($canvasData.nodes.map(n => [n.id, n as CanvasNodeBase])));
  const groups = $derived($canvasData.nodes.filter(n => n.type === 'group') as GroupType[]);
  const nonGroups = $derived($canvasData.nodes.filter(n => n.type !== 'group'));

  function screenToWorld(sx: number, sy: number) {
    const t = $canvasTransform;
    return { x: (sx - t.x) / t.k, y: (sy - t.y) / t.k };
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    canvasTransform.update(t => {
      const newK = Math.min(5, Math.max(0.1, t.k * delta));
      const rect = containerEl!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return {
        x: mx - (mx - t.x) * (newK / t.k),
        y: my - (my - t.y) * (newK / t.k),
        k: newK,
      };
    });
  }

  function handleBgMouseDown(e: MouseEvent) {
    if (e.button === 2) return;
    if ($editingNodeId) {
      editingNodeId.set(null);
      pushUndo();
      return;
    }

    const rect = containerEl!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (e.shiftKey) {
      boxSelecting = true;
      boxStart = { x: sx, y: sy };
      boxEnd = { x: sx, y: sy };
      return;
    }

    isPanning = true;
    panStart = { x: e.clientX - $canvasTransform.x, y: e.clientY - $canvasTransform.y };
    clearSelection();
  }

  function handleMouseMove(e: MouseEvent) {
    if (isPanning) {
      canvasTransform.update(t => ({
        ...t,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
      return;
    }

    if (isDragging && dragNodeId) {
      const rect = containerEl!.getBoundingClientRect();
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const dx = world.x - dragStart.wx;
      const dy = world.y - dragStart.wy;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) didMove = true;
      moveSelectedNodes(dx, dy);
      dragStart = { wx: world.x, wy: world.y };
      return;
    }

    if (boxSelecting) {
      const rect = containerEl!.getBoundingClientRect();
      boxEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      return;
    }

    const de = $drawingEdge;
    if (de) {
      const rect = containerEl!.getBoundingClientRect();
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      drawingEdge.set({ ...de, toX: world.x, toY: world.y });
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (isDragging && didMove) {
      pushUndo();
    }
    isDragging = false;
    dragNodeId = null;
    didMove = false;
    isPanning = false;

    if (boxSelecting) {
      finishBoxSelect();
      boxSelecting = false;
    }

    const de = $drawingEdge;
    if (de) {
      const rect = containerEl!.getBoundingClientRect();
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const hitNode = findNodeAt(world.x, world.y);
      if (hitNode && hitNode.id !== de.fromNodeId) {
        const sides = bestSide(nodesById.get(de.fromNodeId)!, hitNode);
        addEdge({
          id: generateId(),
          fromNode: de.fromNodeId,
          toNode: hitNode.id,
          fromSide: de.fromSide,
          toSide: sides.toSide,
          toEnd: 'arrow',
        });
      }
      drawingEdge.set(null);
    }
  }

  function findNodeAt(wx: number, wy: number): CanvasNodeBase | null {
    for (let i = $canvasData.nodes.length - 1; i >= 0; i--) {
      const n = $canvasData.nodes[i];
      if (n.type === 'group') continue;
      if (wx >= n.x && wx <= n.x + n.width && wy >= n.y && wy <= n.y + n.height) {
        return n;
      }
    }
    return null;
  }

  function finishBoxSelect() {
    const w1 = screenToWorld(Math.min(boxStart.x, boxEnd.x), Math.min(boxStart.y, boxEnd.y));
    const w2 = screenToWorld(Math.max(boxStart.x, boxEnd.x), Math.max(boxStart.y, boxEnd.y));

    const hits = new Set<string>();
    for (const n of $canvasData.nodes) {
      if (n.x >= w1.x && n.y >= w1.y && n.x + n.width <= w2.x && n.y + n.height <= w2.y) {
        hits.add(n.id);
      }
    }
    selectedNodeIds.set(hits);
    selectedEdgeIds.set(new Set());
  }

  function handleDblClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const isBg = target.closest('.canvas-bg-layer') !== null || target === containerEl;
    if (!isBg) return;
    const rect = containerEl!.getBoundingClientRect();
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    createTextNodeAt(world.x - DEFAULT_TEXT_NODE.width / 2, world.y - DEFAULT_TEXT_NODE.height / 2);
  }

  function handleNodeDragStart(e: MouseEvent, nodeId: string) {
    const isInSelection = $selectedNodeIds.has(nodeId);
    if (!isInSelection) {
      if (e.shiftKey) {
        selectedNodeIds.update(s => { s.add(nodeId); return new Set(s); });
      } else {
        selectedNodeIds.set(new Set([nodeId]));
        selectedEdgeIds.set(new Set());
      }
    }

    isDragging = true;
    dragNodeId = nodeId;
    didMove = false;
    const rect = containerEl!.getBoundingClientRect();
    dragStart = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  }

  function handleConnectStart(e: MouseEvent, nodeId: string, side: CanvasSide) {
    const node = nodesById.get(nodeId);
    if (!node) return;
    const anchor = getAnchorPoint(node, side);
    drawingEdge.set({ fromNodeId: nodeId, fromSide: side, toX: anchor.x, toY: anchor.y });
  }

  function handleCanvasContextMenu(e: MouseEvent) {
    e.preventDefault();
    const rect = containerEl!.getBoundingClientRect();
    ctxWorldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    ctxMenu = { x: e.clientX, y: e.clientY, target: 'canvas' };
  }

  function handleNodeContextMenu(e: MouseEvent, nodeId: string) {
    if (!$selectedNodeIds.has(nodeId)) {
      selectedNodeIds.set(new Set([nodeId]));
      selectedEdgeIds.set(new Set());
    }
    const rect = containerEl!.getBoundingClientRect();
    ctxWorldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    ctxMenu = { x: e.clientX, y: e.clientY, target: 'node' };
  }

  function handleEdgeContextMenu(e: MouseEvent, edge: EdgeType) {
    selectedEdgeIds.set(new Set([edge.id]));
    selectedNodeIds.set(new Set());
    ctxMenu = { x: e.clientX, y: e.clientY, target: 'edge' };
  }

  function handleMenuAction(action: MenuAction) {
    switch (action) {
      case 'add-text':
        createTextNodeAt(ctxWorldPos.x, ctxWorldPos.y);
        break;
      case 'add-note':
        notePickerWorldPos = ctxWorldPos;
        notePickerOpen = true;
        break;
      case 'add-group':
        createGroupAt(ctxWorldPos.x, ctxWorldPos.y);
        break;
      case 'edit': {
        const ids = [...$selectedNodeIds];
        if (ids.length === 1) editingNodeId.set(ids[0]);
        break;
      }
      case 'delete':
      case 'edge-delete':
        deleteSelected();
        break;
      case 'color':
        colorPicker = { x: ctxMenu!.x, y: ctxMenu!.y, target: 'node' };
        break;
      case 'edge-color':
        colorPicker = { x: ctxMenu!.x, y: ctxMenu!.y, target: 'edge' };
        break;
      case 'bring-front':
        bringToFront();
        break;
      case 'select-all':
        selectAll();
        break;
      case 'edge-direction': {
        const edgeIds = [...$selectedEdgeIds];
        if (edgeIds.length > 0) {
          const edge = $canvasData.edges.find(e => e.id === edgeIds[0]);
          if (edge) {
            const hasTo = edge.toEnd !== 'none';
            const hasFrom = edge.fromEnd === 'arrow';
            if (hasTo && !hasFrom) {
              updateEdge(edge.id, { fromEnd: 'arrow', toEnd: 'arrow' });
            } else if (hasTo && hasFrom) {
              updateEdge(edge.id, { fromEnd: 'none', toEnd: 'none' });
            } else {
              updateEdge(edge.id, { fromEnd: 'none', toEnd: 'arrow' });
            }
          }
        }
        break;
      }
    }
    ctxMenu = null;
  }

  function createTextNodeAt(x: number, y: number) {
    const node: CanvasTextNode = {
      id: generateId(),
      type: 'text',
      x: snapToGrid(x),
      y: snapToGrid(y),
      width: DEFAULT_TEXT_NODE.width,
      height: DEFAULT_TEXT_NODE.height,
      text: '',
    };
    addNode(node);
    selectedNodeIds.set(new Set([node.id]));
    editingNodeId.set(node.id);
  }

  function createFileNodeAt(x: number, y: number, filePath: string) {
    const node: CanvasFileNode = {
      id: generateId(),
      type: 'file',
      x: snapToGrid(x),
      y: snapToGrid(y),
      width: DEFAULT_FILE_NODE.width,
      height: DEFAULT_FILE_NODE.height,
      file: filePath,
    };
    addNode(node);
    selectedNodeIds.set(new Set([node.id]));
  }

  function createGroupAt(x: number, y: number) {
    const node: GroupType = {
      id: generateId(),
      type: 'group',
      x: snapToGrid(x),
      y: snapToGrid(y),
      width: DEFAULT_GROUP_NODE.width,
      height: DEFAULT_GROUP_NODE.height,
      label: 'Group',
    };
    addNode(node);
    selectedNodeIds.set(new Set([node.id]));
  }

  function handleCreateText() {
    const t = $canvasTransform;
    const cx = (window.innerWidth / 2 - t.x) / t.k;
    const cy = (window.innerHeight / 2 - t.y) / t.k;
    createTextNodeAt(cx - DEFAULT_TEXT_NODE.width / 2, cy - DEFAULT_TEXT_NODE.height / 2);
  }

  function handleCreateNote() {
    const t = $canvasTransform;
    notePickerWorldPos = {
      x: (window.innerWidth / 2 - t.x) / t.k - DEFAULT_FILE_NODE.width / 2,
      y: (window.innerHeight / 2 - t.y) / t.k - DEFAULT_FILE_NODE.height / 2,
    };
    notePickerOpen = true;
  }

  function handleCreateGroup() {
    const sn = $selectedNodeIds;
    if (sn.size >= 2) {
      groupSelected();
    } else {
      const t = $canvasTransform;
      const cx = (window.innerWidth / 2 - t.x) / t.k;
      const cy = (window.innerHeight / 2 - t.y) / t.k;
      createGroupAt(cx - DEFAULT_GROUP_NODE.width / 2, cy - DEFAULT_GROUP_NODE.height / 2);
    }
  }

  function handleNotePicked(path: string) {
    createFileNodeAt(notePickerWorldPos.x, notePickerWorldPos.y, path);
  }

  function handleColorSelect(color: string | undefined) {
    if (colorPicker?.target === 'node') {
      setNodeColor(color as any);
    } else {
      setEdgeColor(color as any);
    }
    colorPicker = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if ($editingNodeId) return;
    const mod = e.ctrlKey || e.metaKey;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelected();
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      clearSelection();
      ctxMenu = null;
      colorPicker = null;
    }
    if (mod && e.key === 'a') {
      e.preventDefault();
      selectAll();
    }
    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
    if (mod && e.key === 's') {
      e.preventDefault();
      saveCanvas();
    }
    if (e.key === '!' && e.shiftKey) {
      e.preventDefault();
      resetView();
    }
  }

  const drawingEdgePath = $derived.by(() => {
    const de = $drawingEdge;
    if (!de) return '';
    const fromNode = nodesById.get(de.fromNodeId);
    if (!fromNode) return '';
    const from = getAnchorPoint(fromNode, de.fromSide);
    const dx = de.toX - from.x;
    const dy = de.toY - from.y;
    const dist = Math.max(30, Math.hypot(dx, dy) * 0.4);
    let cpx = from.x, cpy = from.y;
    if (de.fromSide === 'right') cpx += dist;
    else if (de.fromSide === 'left') cpx -= dist;
    else if (de.fromSide === 'bottom') cpy += dist;
    else cpy -= dist;
    return `M ${from.x} ${from.y} Q ${cpx} ${cpy}, ${de.toX} ${de.toY}`;
  });

  const boxRect = $derived.by(() => {
    if (!boxSelecting) return null;
    return {
      x: Math.min(boxStart.x, boxEnd.x),
      y: Math.min(boxStart.y, boxEnd.y),
      w: Math.abs(boxEnd.x - boxStart.x),
      h: Math.abs(boxEnd.y - boxStart.y),
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={containerEl}
  class="canvas-container"
  onwheel={handleWheel}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onmouseleave={handleMouseUp}
  ondblclick={handleDblClick}
  oncontextmenu={handleCanvasContextMenu}
>
  <svg class="canvas-bg-layer" onmousedown={handleBgMouseDown}>
    <defs>
      <pattern
        id="dot-grid"
        x={$canvasTransform.x % ($canvasTransform.k * 20)}
        y={$canvasTransform.y % ($canvasTransform.k * 20)}
        width={20 * $canvasTransform.k}
        height={20 * $canvasTransform.k}
        patternUnits="userSpaceOnUse"
      >
        <circle cx={1} cy={1} r={1} fill="var(--canvas-dot)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="var(--canvas-bg)" />
    <rect width="100%" height="100%" fill="url(#dot-grid)" />
  </svg>

  <div
    class="canvas-transform-layer"
    style="transform: translate({$canvasTransform.x}px, {$canvasTransform.y}px) scale({$canvasTransform.k});"
  >
    <svg class="canvas-edge-layer">
      {#each $canvasData.edges as edge (edge.id)}
        <CanvasEdge {edge} {nodesById} oncontextmenu={(e, ed) => handleEdgeContextMenu(e, ed)} />
      {/each}

      {#if drawingEdgePath}
        <path
          d={drawingEdgePath}
          fill="none"
          stroke="var(--accent)"
          stroke-width="2"
          stroke-dasharray="6 4"
          style="pointer-events: none;"
        />
      {/if}
    </svg>

    {#each groups as node (node.id)}
      <CanvasGroupNode
        {node}
        oncontextmenu={(e) => handleNodeContextMenu(e, node.id)}
        ondragstart={handleNodeDragStart}
      />
    {/each}

    {#each nonGroups as node (node.id)}
      {#if node.type === 'text'}
        <CanvasTextCard
          node={node as CanvasTextNode}
          oncontextmenu={(e) => handleNodeContextMenu(e, node.id)}
          ondragstart={handleNodeDragStart}
          onconnectstart={handleConnectStart}
        />
      {:else if node.type === 'file'}
        <CanvasFileCard
          node={node as CanvasFileNode}
          oncontextmenu={(e) => handleNodeContextMenu(e, node.id)}
          ondragstart={handleNodeDragStart}
          onconnectstart={handleConnectStart}
        />
      {/if}
    {/each}
  </div>

  {#if boxRect}
    <div
      class="box-select-rect"
      style="left: {boxRect.x}px; top: {boxRect.y}px; width: {boxRect.w}px; height: {boxRect.h}px;"
    ></div>
  {/if}

  <CanvasToolbar />
  <CanvasCreationBar
    oncreatetext={handleCreateText}
    oncreatenote={handleCreateNote}
    oncreategroup={handleCreateGroup}
  />

  {#if ctxMenu}
    <CanvasContextMenu
      x={ctxMenu.x}
      y={ctxMenu.y}
      target={ctxMenu.target}
      onaction={handleMenuAction}
      onclose={() => ctxMenu = null}
    />
  {/if}

  {#if colorPicker}
    <CanvasColorPicker
      x={colorPicker.x}
      y={colorPicker.y}
      onselect={handleColorSelect}
      onclose={() => colorPicker = null}
    />
  {/if}
</div>

<CanvasNotePicker
  bind:open={notePickerOpen}
  onselect={handleNotePicked}
/>

<style>
  .canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: default;
    user-select: none;
  }

  .canvas-bg-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .canvas-transform-layer {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    z-index: 1;
    width: 0;
    height: 0;
    overflow: visible;
  }

  .canvas-edge-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: visible;
    z-index: 0;
    pointer-events: none;
  }

  .canvas-edge-layer :global(path) {
    pointer-events: auto;
  }

  .box-select-rect {
    position: absolute;
    border: 1.5px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    border-radius: 2px;
    z-index: 30;
    pointer-events: none;
  }
</style>
