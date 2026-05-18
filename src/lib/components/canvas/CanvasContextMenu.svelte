<script lang="ts" module>
  export type MenuAction =
    | 'add-text' | 'add-note' | 'add-group'
    | 'edit' | 'delete' | 'color' | 'bring-front'
    | 'select-all'
    | 'edge-delete' | 'edge-color' | 'edge-direction';
</script>

<script lang="ts">
  let {
    x,
    y,
    target,
    onaction,
    onclose,
  }: {
    x: number;
    y: number;
    target: 'canvas' | 'node' | 'edge';
    onaction: (action: MenuAction) => void;
    onclose: () => void;
  } = $props();

  function handle(action: MenuAction) {
    onaction(action);
    onclose();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ctx-backdrop" onclick={onclose}>
  <div
    class="ctx-menu"
    style="left: {x}px; top: {y}px;"
    onclick={(e) => e.stopPropagation()}
  >
    {#if target === 'canvas'}
      <button class="ctx-item" onclick={() => handle('add-text')}>Add text card</button>
      <button class="ctx-item" onclick={() => handle('add-note')}>Add note from vault</button>
      <button class="ctx-item" onclick={() => handle('add-group')}>Create group</button>
      <div class="ctx-divider"></div>
      <button class="ctx-item" onclick={() => handle('select-all')}>Select all</button>
    {:else if target === 'node'}
      <button class="ctx-item" onclick={() => handle('edit')}>Edit</button>
      <button class="ctx-item" onclick={() => handle('color')}>Set color</button>
      <button class="ctx-item" onclick={() => handle('bring-front')}>Bring to front</button>
      <div class="ctx-divider"></div>
      <button class="ctx-item ctx-danger" onclick={() => handle('delete')}>Delete</button>
    {:else if target === 'edge'}
      <button class="ctx-item" onclick={() => handle('edge-color')}>Set color</button>
      <button class="ctx-item" onclick={() => handle('edge-direction')}>Toggle direction</button>
      <div class="ctx-divider"></div>
      <button class="ctx-item ctx-danger" onclick={() => handle('edge-delete')}>Remove</button>
    {/if}
  </div>
</div>

<style>
  .ctx-backdrop {
    position: fixed;
    inset: 0;
    z-index: 90;
  }

  .ctx-menu {
    position: fixed;
    min-width: 180px;
    padding: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    z-index: 91;
  }

  .ctx-item {
    display: block;
    width: 100%;
    padding: 7px 12px;
    border: none;
    background: transparent;
    text-align: left;
    font-size: 13px;
    color: var(--text);
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .ctx-item:hover {
    background: var(--surface-hover);
  }

  .ctx-danger {
    color: #ef4444;
  }

  .ctx-divider {
    height: 1px;
    background: var(--border);
    margin: 4px 8px;
  }
</style>
