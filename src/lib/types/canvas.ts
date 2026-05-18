export type CanvasNodeType = 'text' | 'file' | 'group';
export type CanvasSide = 'top' | 'right' | 'bottom' | 'left';
export type CanvasEndType = 'none' | 'arrow';
export type CanvasColorPreset = '1' | '2' | '3' | '4' | '5' | '6';
export type CanvasColor = CanvasColorPreset | string;

export interface CanvasNodeBase {
  id: string;
  type: CanvasNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: CanvasColor;
}

export interface CanvasTextNode extends CanvasNodeBase {
  type: 'text';
  text: string;
}

export interface CanvasFileNode extends CanvasNodeBase {
  type: 'file';
  file: string;
  subpath?: string;
}

export interface CanvasGroupNode extends CanvasNodeBase {
  type: 'group';
  label?: string;
}

export type CanvasNode = CanvasTextNode | CanvasFileNode | CanvasGroupNode;

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: CanvasSide;
  toSide?: CanvasSide;
  fromEnd?: CanvasEndType;
  toEnd?: CanvasEndType;
  color?: CanvasColor;
  label?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface CanvasTransform {
  x: number;
  y: number;
  k: number;
}

export const CANVAS_COLORS: Record<CanvasColorPreset, { name: string; dark: string; light: string }> = {
  '1': { name: 'Red',    dark: '#fb464c', light: '#e93147' },
  '2': { name: 'Orange', dark: '#e9973f', light: '#ec7500' },
  '3': { name: 'Yellow', dark: '#e0de71', light: '#e0ac00' },
  '4': { name: 'Green',  dark: '#44cf6e', light: '#08b94e' },
  '5': { name: 'Cyan',   dark: '#53dfdd', light: '#00bfbc' },
  '6': { name: 'Purple', dark: '#a882ff', light: '#7852ee' },
};

export const DEFAULT_TEXT_NODE = { width: 260, height: 160 } as const;
export const DEFAULT_FILE_NODE = { width: 280, height: 120 } as const;
export const DEFAULT_GROUP_NODE = { width: 400, height: 300 } as const;
export const GRID_SIZE = 20;
export const MIN_NODE_WIDTH = 120;
export const MIN_NODE_HEIGHT = 60;

export function generateId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function snapToGrid(value: number, gridSize = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function resolveColor(color: CanvasColor | undefined, isDark: boolean): string | undefined {
  if (!color) return undefined;
  const preset = CANVAS_COLORS[color as CanvasColorPreset];
  if (preset) return isDark ? preset.dark : preset.light;
  return color;
}

export function getAnchorPoint(
  node: CanvasNodeBase,
  side: CanvasSide
): { x: number; y: number } {
  switch (side) {
    case 'top':    return { x: node.x + node.width / 2, y: node.y };
    case 'bottom': return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left':   return { x: node.x, y: node.y + node.height / 2 };
    case 'right':  return { x: node.x + node.width, y: node.y + node.height / 2 };
  }
}

export function bestSide(
  from: CanvasNodeBase,
  to: CanvasNodeBase
): { fromSide: CanvasSide; toSide: CanvasSide } {
  const fcx = from.x + from.width / 2;
  const fcy = from.y + from.height / 2;
  const tcx = to.x + to.width / 2;
  const tcy = to.y + to.height / 2;
  const dx = tcx - fcx;
  const dy = tcy - fcy;

  let fromSide: CanvasSide;
  let toSide: CanvasSide;

  if (Math.abs(dx) > Math.abs(dy)) {
    fromSide = dx > 0 ? 'right' : 'left';
    toSide = dx > 0 ? 'left' : 'right';
  } else {
    fromSide = dy > 0 ? 'bottom' : 'top';
    toSide = dy > 0 ? 'top' : 'bottom';
  }

  return { fromSide, toSide };
}

export function bezierPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromSide: CanvasSide,
  toSide: CanvasSide
): string {
  const dist = Math.max(40, Math.hypot(to.x - from.x, to.y - from.y) * 0.4);
  const cp1 = offsetControlPoint(from, fromSide, dist);
  const cp2 = offsetControlPoint(to, toSide, dist);
  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
}

function offsetControlPoint(
  point: { x: number; y: number },
  side: CanvasSide,
  dist: number
): { x: number; y: number } {
  switch (side) {
    case 'top':    return { x: point.x, y: point.y - dist };
    case 'bottom': return { x: point.x, y: point.y + dist };
    case 'left':   return { x: point.x - dist, y: point.y };
    case 'right':  return { x: point.x + dist, y: point.y };
  }
}
