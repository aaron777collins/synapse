<script lang="ts">
  import {
    canvasTransform,
    canUndo,
    canRedo,
    undo,
    redo,
    resetView,
    canvasSaveStatus,
  } from '$lib/stores/canvas';

  function zoomIn() {
    canvasTransform.update(t => {
      const newK = Math.min(5, t.k * 1.25);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return {
        x: cx - (cx - t.x) * (newK / t.k),
        y: cy - (cy - t.y) * (newK / t.k),
        k: newK,
      };
    });
  }

  function zoomOut() {
    canvasTransform.update(t => {
      const newK = Math.max(0.1, t.k * 0.8);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return {
        x: cx - (cx - t.x) * (newK / t.k),
        y: cy - (cy - t.y) * (newK / t.k),
        k: newK,
      };
    });
  }

  const zoomPercent = $derived(Math.round($canvasTransform.k * 100));

  const statusColor: Record<string, string> = {
    saved: '#22c55e',
    saving: '#eab308',
    unsaved: '#f97316',
    error: '#ef4444',
  };
</script>

<div class="canvas-toolbar">
  <div class="toolbar-group">
    <button class="toolbar-btn" onclick={undo} disabled={!$canUndo} title="Undo (Ctrl+Z)">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>
    </button>
    <button class="toolbar-btn" onclick={redo} disabled={!$canRedo} title="Redo (Ctrl+Y)">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <div class="toolbar-group">
    <button class="toolbar-btn" onclick={zoomOut} title="Zoom out">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    </button>
    <span class="zoom-label">{zoomPercent}%</span>
    <button class="toolbar-btn" onclick={zoomIn} title="Zoom in">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    </button>
    <button class="toolbar-btn" onclick={resetView} title="Zoom to fit (Shift+1)">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
      </svg>
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <span class="save-indicator" title={$canvasSaveStatus}>
    <span class="save-dot" style="background: {statusColor[$canvasSaveStatus]};"></span>
  </span>
</div>

<style>
  .canvas-toolbar {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    color: var(--text);
    cursor: pointer;
    transition: background 0.15s;
  }

  .toolbar-btn:hover:not(:disabled) {
    background: var(--surface-hover);
  }

  .toolbar-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: var(--border);
    margin: 0 2px;
  }

  .zoom-label {
    font-size: 11px;
    color: var(--text-muted);
    min-width: 36px;
    text-align: center;
    user-select: none;
  }

  .save-indicator {
    display: flex;
    align-items: center;
    padding: 0 4px;
  }

  .save-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: background 0.3s;
  }
</style>
