<script lang="ts">
  let {
    oncreatetext,
    oncreatenote,
    oncreategroup,
  }: {
    oncreatetext: () => void;
    oncreatenote: () => void;
    oncreategroup: () => void;
  } = $props();
</script>

<div class="creation-bar">
  <button class="creation-btn" onclick={oncreatetext} title="Add text card">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/>
    </svg>
    <span>Text</span>
  </button>
  <button class="creation-btn" onclick={oncreatenote} title="Add note from vault">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
    <span>Note</span>
  </button>
  <button class="creation-btn" onclick={oncreategroup} title="Create group">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
      <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
    </svg>
    <span>Group</span>
  </button>
</div>

<style>
  .creation-bar {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    gap: 4px;
    padding: 6px 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  }

  .creation-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }

  .creation-btn:hover {
    background: var(--surface-hover);
  }

  .creation-btn:active {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
  }
</style>
