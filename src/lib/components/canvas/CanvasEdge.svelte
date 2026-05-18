<script lang="ts">
  import {
    type CanvasEdge,
    type CanvasNodeBase,
    getAnchorPoint,
    bestSide,
    bezierPath,
    resolveColor,
  } from '$lib/types/canvas';
  import { selectedEdgeIds, selectedNodeIds } from '$lib/stores/canvas';
  import { theme } from '$lib/stores/ui';

  let {
    edge,
    nodesById,
    oncontextmenu,
  }: {
    edge: CanvasEdge;
    nodesById: Map<string, CanvasNodeBase>;
    oncontextmenu?: (e: MouseEvent, edge: CanvasEdge) => void;
  } = $props();

  let hovered = $state(false);

  const fromNode = $derived(nodesById.get(edge.fromNode));
  const toNode = $derived(nodesById.get(edge.toNode));
  const isSelected = $derived($selectedEdgeIds.has(edge.id));
  const isDark = $derived($theme === 'dark');

  const sides = $derived.by(() => {
    if (!fromNode || !toNode) return null;
    const fs = edge.fromSide ?? bestSide(fromNode, toNode).fromSide;
    const ts = edge.toSide ?? bestSide(fromNode, toNode).toSide;
    return { fromSide: fs, toSide: ts };
  });

  const pathD = $derived.by(() => {
    if (!fromNode || !toNode || !sides) return '';
    const from = getAnchorPoint(fromNode, sides.fromSide);
    const to = getAnchorPoint(toNode, sides.toSide);
    return bezierPath(from, to, sides.fromSide, sides.toSide);
  });

  const strokeColor = $derived(
    resolveColor(edge.color, isDark) ?? (isDark ? '#475569' : '#94a3b8')
  );

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    if (e.shiftKey) {
      selectedEdgeIds.update(s => { s.has(edge.id) ? s.delete(edge.id) : s.add(edge.id); return new Set(s); });
    } else {
      selectedNodeIds.set(new Set());
      selectedEdgeIds.set(new Set([edge.id]));
    }
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    oncontextmenu?.(e, edge);
  }

  const showToArrow = $derived(edge.toEnd !== 'none');
  const showFromArrow = $derived(edge.fromEnd === 'arrow');
  const markerId = $derived(`arrow-${edge.id}`);
  const markerFromId = $derived(`arrow-from-${edge.id}`);
</script>

{#if pathD}
  <defs>
    {#if showToArrow}
      <marker
        id={markerId}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill={isSelected || hovered ? 'var(--accent)' : strokeColor} />
      </marker>
    {/if}
    {#if showFromArrow}
      <marker
        id={markerFromId}
        viewBox="0 0 10 10"
        refX="1"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 10 0 L 0 5 L 10 10 z" fill={isSelected || hovered ? 'var(--accent)' : strokeColor} />
      </marker>
    {/if}
  </defs>

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <path
    d={pathD}
    fill="none"
    stroke="transparent"
    stroke-width="16"
    style="cursor: pointer;"
    onclick={handleClick}
    oncontextmenu={handleContextMenu}
    onmouseenter={() => hovered = true}
    onmouseleave={() => hovered = false}
  />

  <path
    d={pathD}
    fill="none"
    stroke={isSelected || hovered ? 'var(--accent)' : strokeColor}
    stroke-width={isSelected || hovered ? 2.5 : 2}
    marker-end={showToArrow ? `url(#${markerId})` : undefined}
    marker-start={showFromArrow ? `url(#${markerFromId})` : undefined}
    style="pointer-events: none; transition: stroke 0.15s, stroke-width 0.15s;"
  />

  {#if edge.label}
    {@const fn = fromNode!}
    {@const tn = toNode!}
    {@const lx = (fn.x + fn.width / 2 + tn.x + tn.width / 2) / 2}
    {@const ly = (fn.y + fn.height / 2 + tn.y + tn.height / 2) / 2}
    <text
      x={lx}
      y={ly - 8}
      text-anchor="middle"
      fill={isSelected ? 'var(--accent)' : 'var(--text-muted)'}
      font-size="12"
      style="pointer-events: none;"
    >{edge.label}</text>
  {/if}
{/if}
