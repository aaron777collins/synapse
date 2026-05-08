<script lang="ts">
  let { open = $bindable(false) }: { open: boolean } = $props();

  function close() {
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  const shortcuts = [
    { keys: ["Ctrl", "K"],        action: "Quick Switcher" },
    { keys: ["Ctrl", "S"],        action: "Save current note" },
    { keys: ["Ctrl", "\\"],       action: "Toggle sidebar" },
    { keys: ["Ctrl", "G"],        action: "Graph view" },
    { keys: ["Ctrl", "."],        action: "Toggle backlinks" },
    { keys: ["Ctrl", "Shift", "F"], action: "Search all notes" },
    { keys: ["Ctrl", "?"],        action: "This help guide" },
    { keys: ["Ctrl", "E"],        action: "Toggle edit/preview" },
    { keys: ["Ctrl", "B"],        action: "Bold selection" },
    { keys: ["Ctrl", "I"],        action: "Italic selection" },
  ] as const;
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="help-backdrop"
    onclick={handleBackdropClick}
  >
    <div class="help-panel" role="dialog" aria-modal="true" aria-label="Help guide" tabindex="-1">
      <!-- Header -->
      <div class="help-header">
        <h2 class="help-title">Synapse Guide</h2>
        <button class="close-btn" onclick={close} aria-label="Close help">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Scrollable body -->
      <div class="help-body">

        <!-- Getting Started -->
        <section>
          <h3 class="section-heading">Getting Started</h3>
          <ul class="tip-list">
            <li>Create notes via the <strong>New Note</strong> button or the file tree.</li>
            <li>Create folders via the <strong>New Folder</strong> button.</li>
            <li>Click any <code>.md</code> file to open it in the editor.</li>
            <li>Files <strong>auto-save</strong> 1.2 seconds after you stop typing.</li>
          </ul>
        </section>

        <!-- Writing & Editing -->
        <section>
          <h3 class="section-heading">Writing &amp; Editing</h3>
          <ul class="tip-list">
            <li>Full <strong>Markdown</strong> support: headings, bold, italic, lists, checkboxes, and code blocks.</li>
            <li><strong>Wikilinks</strong>: Type <code>[[</code> to link to another note — autocomplete will suggest matching notes.</li>
            <li><strong>Tags</strong>: Use <code>#tagname</code> anywhere in your note to categorize it.</li>
            <li>The editor supports line numbers, syntax highlighting, and line wrapping.</li>
            <li><strong>Preview mode</strong> (<kbd>Ctrl</kbd><kbd>E</kbd>): Toggle between editing and a rendered markdown preview. Tags and wikilinks are clickable in both modes.</li>
          </ul>
        </section>

        <!-- Navigation -->
        <section>
          <h3 class="section-heading">Navigation</h3>
          <ul class="tip-list">
            <li>
              <strong>Quick Switcher</strong> (<kbd>Ctrl</kbd><kbd>K</kbd>): Fuzzy-find and jump to any note instantly.
            </li>
            <li><strong>File Tree</strong>: Browse, rename (right-click), or delete files and folders.</li>
            <li>
              <strong>Tabs</strong>: Open files appear as tabs above the editor. Click to switch,
              <kbd>×</kbd> to close, or middle-click to close.
            </li>
            <li><strong>Wikilink click</strong>: Click any <code>[[link]]</code> in the editor to navigate to that note.</li>
          </ul>
        </section>

        <!-- Search -->
        <section>
          <h3 class="section-heading">Search</h3>
          <ul class="tip-list">
            <li>
              <strong>Global Search</strong> (<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>F</kbd>):
              Search across all notes with highlighted matches.
            </li>
            <li>Click the Search icon in the Activity Bar or use the search box in the sidebar.</li>
            <li>Results show matching lines with context.</li>
          </ul>
        </section>

        <!-- Knowledge Graph -->
        <section>
          <h3 class="section-heading">Knowledge Graph</h3>
          <ul class="tip-list">
            <li>
              <strong>Graph View</strong> (<kbd>Ctrl</kbd><kbd>G</kbd>): Visual network of all your notes and their connections.
            </li>
            <li>Nodes represent notes; edges represent wikilinks between them.</li>
            <li>Click a node to navigate to that note.</li>
            <li>Drag nodes to rearrange; scroll to zoom.</li>
          </ul>
        </section>

        <!-- Backlinks -->
        <section>
          <h3 class="section-heading">Backlinks</h3>
          <ul class="tip-list">
            <li>The <strong>Backlinks</strong> panel at the bottom of the editor shows all notes that link to the current note.</li>
            <li>Toggle with <kbd>Ctrl</kbd><kbd>.</kbd> or the link icon in the Activity Bar.</li>
            <li>Click a backlink source to navigate to it.</li>
          </ul>
        </section>

        <!-- Tags -->
        <section>
          <h3 class="section-heading">Tags</h3>
          <ul class="tip-list">
            <li>The <strong>Tags</strong> panel in the sidebar shows all <code>#tags</code> used across your notes.</li>
            <li>Click a tag to see which notes contain it.</li>
          </ul>
        </section>

        <!-- Activity Bar -->
        <section>
          <h3 class="section-heading">Activity Bar</h3>
          <ul class="tip-list">
            <li><strong>Explorer</strong>: Toggle the file tree sidebar (<kbd>Ctrl</kbd><kbd>\</kbd>).</li>
            <li><strong>Search</strong>: Open search mode.</li>
            <li><strong>Graph</strong>: Toggle the graph view.</li>
            <li><strong>Backlinks</strong>: Toggle the backlinks panel.</li>
            <li><strong>Help</strong>: Open this help guide.</li>
          </ul>
        </section>

        <!-- Keyboard Shortcuts grid -->
        <section>
          <h3 class="section-heading">Keyboard Shortcuts</h3>
          <div class="shortcuts-grid">
            {#each shortcuts as { keys, action }}
              <div class="shortcut-row">
                <span class="shortcut-keys">
                  {#each keys as key, i}
                    {#if i > 0}<span class="shortcut-plus">+</span>{/if}
                    <kbd>{key}</kbd>
                  {/each}
                </span>
                <span class="shortcut-action">{action}</span>
              </div>
            {/each}
          </div>
        </section>

        <!-- Tips -->
        <section>
          <h3 class="section-heading">Tips</h3>
          <ul class="tip-list">
            <li>Right-click files or folders in the tree for rename/delete options.</li>
            <li>The sidebar is resizable — drag the border between the sidebar and editor.</li>
            <li>Your notes are stored as plain <code>.md</code> files, fully portable.</li>
          </ul>
        </section>

      </div>

      <!-- Footer -->
      <div class="help-footer">
        <span>Press <kbd>Esc</kbd> to close</span>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ── Animations ──────────────────────────────────────────── */
  @keyframes help-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes help-scale-in {
    from { opacity: 0; transform: scale(0.96) translateY(-8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* ── Backdrop ────────────────────────────────────────────── */
  .help-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    animation: help-fade-in 0.15s ease-out both;
  }

  /* ── Panel card ──────────────────────────────────────────── */
  .help-panel {
    width: 100%;
    max-width: 700px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    animation: help-scale-in 0.15s ease-out both;
  }

  /* ── Header ──────────────────────────────────────────────── */
  .help-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .help-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.12s ease, background 0.12s ease;
  }

  .close-btn:hover {
    color: var(--text);
    background: var(--surface-hover);
  }

  /* ── Scrollable body ─────────────────────────────────────── */
  .help-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    /* Thin custom scrollbar to stay on-brand */
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  /* ── Sections ────────────────────────────────────────────── */
  section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .section-heading {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
  }

  .tip-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .tip-list li {
    font-size: 0.83rem;
    color: var(--text-muted);
    line-height: 1.55;
    padding-left: 1rem;
    position: relative;
  }

  /* Subtle bullet using a pseudo-element so it can use accent color */
  .tip-list li::before {
    content: "–";
    position: absolute;
    left: 0;
    color: var(--accent);
    opacity: 0.6;
  }

  .tip-list strong {
    color: var(--text);
    font-weight: 600;
  }

  /* ── Keyboard shortcuts grid ─────────────────────────────── */
  .shortcuts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem 1.5rem;
  }

  @media (max-width: 520px) {
    .shortcuts-grid {
      grid-template-columns: 1fr;
    }
  }

  .shortcut-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0;
  }

  .shortcut-keys {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    /* Fixed width keeps action text aligned across rows */
    min-width: 120px;
  }

  .shortcut-plus {
    font-size: 0.65rem;
    color: var(--text-muted);
    padding: 0 1px;
  }

  .shortcut-action {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  /* ── kbd badges ──────────────────────────────────────────── */
  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.68rem;
    font-family: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    white-space: nowrap;
    line-height: 1.4;
  }

  /* Inline code in prose */
  code {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
    font-size: 0.78rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 1px 4px;
    color: var(--text);
  }

  /* ── Footer ──────────────────────────────────────────────── */
  .help-footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.6rem 1.25rem;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--text-muted);
    opacity: 0.7;
    gap: 0.35rem;
  }
</style>
