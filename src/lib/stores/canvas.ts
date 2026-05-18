import { writable, get } from 'svelte/store';
import { api } from '$lib/services/api';
import { activeFile } from '$lib/stores/vault';
import { debounce } from '$lib/utils/debounce';
import {
  type CanvasData,
  type CanvasNode,
  type CanvasEdge,
  type CanvasTransform,
  type CanvasColor,
  generateId,
} from '$lib/types/canvas';

export const canvasData = writable<CanvasData>({ nodes: [], edges: [] });
export const canvasTransform = writable<CanvasTransform>({ x: 0, y: 0, k: 1 });
export const selectedNodeIds = writable<Set<string>>(new Set());
export const selectedEdgeIds = writable<Set<string>>(new Set());
export const canvasDirty = writable(false);
export const canvasSaveStatus = writable<'saved' | 'saving' | 'unsaved' | 'error'>('saved');

export const editingNodeId = writable<string | null>(null);
export const drawingEdge = writable<{
  fromNodeId: string;
  fromSide: 'top' | 'right' | 'bottom' | 'left';
  toX: number;
  toY: number;
} | null>(null);

let undoStack: string[] = [];
let redoStack: string[] = [];
export const canUndo = writable(false);
export const canRedo = writable(false);

function snapshot(): string {
  return JSON.stringify(get(canvasData));
}

export function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
  canUndo.set(true);
  canRedo.set(false);
  markDirty();
}

export function undo() {
  const current = snapshot();
  const prev = undoStack.pop();
  if (!prev) return;
  redoStack.push(current);
  canvasData.set(JSON.parse(prev));
  canUndo.set(undoStack.length > 0);
  canRedo.set(true);
  markDirty();
}

export function redo() {
  const current = snapshot();
  const next = redoStack.pop();
  if (!next) return;
  undoStack.push(current);
  canvasData.set(JSON.parse(next));
  canUndo.set(true);
  canRedo.set(redoStack.length > 0);
  markDirty();
}

function markDirty() {
  canvasDirty.set(true);
  canvasSaveStatus.set('unsaved');
  debouncedSave();
}

const debouncedSave = debounce(() => {
  saveCanvas();
}, 1200);

export async function saveCanvas() {
  const path = get(activeFile);
  if (!path || !path.endsWith('.canvas')) return;
  const data = get(canvasData);
  canvasSaveStatus.set('saving');
  try {
    await api.files.write(path, JSON.stringify(data, null, 2));
    canvasDirty.set(false);
    canvasSaveStatus.set('saved');
  } catch {
    canvasSaveStatus.set('error');
  }
}

export async function loadCanvas(path: string) {
  try {
    const { content } = await api.files.read(path);
    const data: CanvasData = content.trim() ? JSON.parse(content) : { nodes: [], edges: [] };
    if (!data.nodes) data.nodes = [];
    if (!data.edges) data.edges = [];
    canvasData.set(data);
    selectedNodeIds.set(new Set());
    selectedEdgeIds.set(new Set());
    editingNodeId.set(null);
    drawingEdge.set(null);
    undoStack = [];
    redoStack = [];
    canUndo.set(false);
    canRedo.set(false);
    canvasDirty.set(false);
    canvasSaveStatus.set('saved');

    // Center the view on content, or center of viewport if empty
    if (typeof window !== 'undefined') {
      if (data.nodes.length > 0) {
        const minX = Math.min(...data.nodes.map(n => n.x));
        const minY = Math.min(...data.nodes.map(n => n.y));
        const maxX = Math.max(...data.nodes.map(n => n.x + n.width));
        const maxY = Math.max(...data.nodes.map(n => n.y + n.height));
        const contentW = maxX - minX + 100;
        const contentH = maxY - minY + 100;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const k = Math.min(1, Math.min(vw / contentW, vh / contentH));
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        canvasTransform.set({ x: vw / 2 - cx * k, y: vh / 2 - cy * k, k });
      } else {
        canvasTransform.set({ x: window.innerWidth / 2, y: window.innerHeight / 2, k: 1 });
      }
    }
  } catch {
    canvasData.set({ nodes: [], edges: [] });
    canvasSaveStatus.set('error');
  }
}

export function addNode(node: CanvasNode) {
  pushUndo();
  canvasData.update(d => ({ ...d, nodes: [...d.nodes, node] }));
}

export function updateNode(id: string, changes: Partial<CanvasNode>) {
  canvasData.update(d => ({
    ...d,
    nodes: d.nodes.map(n => n.id === id ? { ...n, ...changes } as CanvasNode : n),
  }));
}

export function updateNodeWithUndo(id: string, changes: Partial<CanvasNode>) {
  pushUndo();
  updateNode(id, changes);
}

export function deleteSelected() {
  const nodeIds = get(selectedNodeIds);
  const edgeIds = get(selectedEdgeIds);
  if (nodeIds.size === 0 && edgeIds.size === 0) return;
  pushUndo();
  canvasData.update(d => ({
    nodes: d.nodes.filter(n => !nodeIds.has(n.id)),
    edges: d.edges.filter(e =>
      !edgeIds.has(e.id) && !nodeIds.has(e.fromNode) && !nodeIds.has(e.toNode)
    ),
  }));
  selectedNodeIds.set(new Set());
  selectedEdgeIds.set(new Set());
}

export function addEdge(edge: CanvasEdge) {
  pushUndo();
  canvasData.update(d => ({ ...d, edges: [...d.edges, edge] }));
}

export function updateEdge(id: string, changes: Partial<CanvasEdge>) {
  pushUndo();
  canvasData.update(d => ({
    ...d,
    edges: d.edges.map(e => e.id === id ? { ...e, ...changes } : e),
  }));
}

export function setNodeColor(color: CanvasColor | undefined) {
  const nodeIds = get(selectedNodeIds);
  if (nodeIds.size === 0) return;
  pushUndo();
  canvasData.update(d => ({
    ...d,
    nodes: d.nodes.map(n => nodeIds.has(n.id) ? { ...n, color } as CanvasNode : n),
  }));
}

export function setEdgeColor(color: CanvasColor | undefined) {
  const edgeIds = get(selectedEdgeIds);
  if (edgeIds.size === 0) return;
  pushUndo();
  canvasData.update(d => ({
    ...d,
    edges: d.edges.map(e => edgeIds.has(e.id) ? { ...e, color } : e),
  }));
}

export function moveSelectedNodes(dx: number, dy: number) {
  const nodeIds = get(selectedNodeIds);
  if (nodeIds.size === 0) return;
  canvasData.update(d => ({
    ...d,
    nodes: d.nodes.map(n => {
      if (!nodeIds.has(n.id)) return n;
      return { ...n, x: n.x + dx, y: n.y + dy } as CanvasNode;
    }),
  }));
}

export function bringToFront() {
  const nodeIds = get(selectedNodeIds);
  if (nodeIds.size === 0) return;
  pushUndo();
  canvasData.update(d => {
    const selected = d.nodes.filter(n => nodeIds.has(n.id));
    const rest = d.nodes.filter(n => !nodeIds.has(n.id));
    return { ...d, nodes: [...rest, ...selected] };
  });
}

export function selectAll() {
  const data = get(canvasData);
  selectedNodeIds.set(new Set(data.nodes.map(n => n.id)));
  selectedEdgeIds.set(new Set(data.edges.map(e => e.id)));
}

export function clearSelection() {
  selectedNodeIds.set(new Set());
  selectedEdgeIds.set(new Set());
  editingNodeId.set(null);
}

export function groupSelected() {
  const nodeIds = get(selectedNodeIds);
  const data = get(canvasData);
  const selected = data.nodes.filter(n => nodeIds.has(n.id));
  if (selected.length < 2) return;

  const minX = Math.min(...selected.map(n => n.x)) - 20;
  const minY = Math.min(...selected.map(n => n.y)) - 40;
  const maxX = Math.max(...selected.map(n => n.x + n.width)) + 20;
  const maxY = Math.max(...selected.map(n => n.y + n.height)) + 20;

  const group: CanvasNode = {
    id: generateId(),
    type: 'group',
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    label: 'Group',
  };

  pushUndo();
  canvasData.update(d => ({
    ...d,
    nodes: [group, ...d.nodes],
  }));
}

export function resetView() {
  const data = get(canvasData);
  if (data.nodes.length === 0) {
    canvasTransform.set({ x: window.innerWidth / 2, y: window.innerHeight / 2, k: 1 });
    return;
  }
  const minX = Math.min(...data.nodes.map(n => n.x));
  const minY = Math.min(...data.nodes.map(n => n.y));
  const maxX = Math.max(...data.nodes.map(n => n.x + n.width));
  const maxY = Math.max(...data.nodes.map(n => n.y + n.height));
  const contentW = maxX - minX + 100;
  const contentH = maxY - minY + 100;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const k = Math.min(1, Math.min(vw / contentW, vh / contentH));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  canvasTransform.set({ x: vw / 2 - cx * k, y: vh / 2 - cy * k, k });
}
