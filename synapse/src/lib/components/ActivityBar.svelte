<script lang="ts">
  import { sidebarOpen, graphOpen, backlinksOpen, helpOpen } from "$lib/stores/ui";
  import { searchActive } from "$lib/stores/search";

  // Which activity bar section is currently "active" (shows accent border)
  type Panel = "explorer" | "search" | "graph" | "backlinks" | "help";
  let activePanel = $state<Panel | null>("explorer");

  function activate(panel: Panel) {
    if (panel === "explorer") {
      // Toggle the sidebar; keep explorer as active only when open
      if ($sidebarOpen && activePanel === "explorer") {
        sidebarOpen.set(false);
        activePanel = null;
      } else {
        sidebarOpen.set(true);
        activePanel = "explorer";
        // Clear search so file tree shows
        searchActive.set(false);
      }
      return;
    }

    if (panel === "search") {
      sidebarOpen.set(true);
      activePanel = "search";
      // Trigger search mode in the sidebar by setting searchActive
      searchActive.set(true);
      // Focus the search input after the sidebar is visible
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>(".search-input");
        input?.focus();
      });
      return;
    }

    if (panel === "graph") {
      const next = !$graphOpen;
      graphOpen.set(next);
      activePanel = next ? "graph" : null;
      return;
    }

    if (panel === "backlinks") {
      const next = !$backlinksOpen;
      backlinksOpen.set(next);
      activePanel = next ? "backlinks" : null;
      return;
    }

    if (panel === "help") {
      const next = !$helpOpen;
      helpOpen.set(next);
      // Help is a transient modal; don't keep it as an "active" sidebar section
      activePanel = null;
    }
  }

  // Keep activePanel in sync with store changes driven by keyboard shortcuts
  $effect(() => {
    if (!$sidebarOpen && activePanel === "explorer") activePanel = null;
  });
  $effect(() => {
    if (!$graphOpen && activePanel === "graph") activePanel = null;
  });
  $effect(() => {
    if (!$backlinksOpen && activePanel === "backlinks") activePanel = null;
  });
</script>

<nav class="activity-bar" aria-label="Activity bar">
  <!-- Explorer -->
  <button
    class="activity-btn"
    class:active={activePanel === "explorer"}
    onclick={() => activate("explorer")}
    title="Explorer"
    aria-label="Explorer"
  >
    <!-- Files icon — two stacked document pages -->
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
      <polyline points="13 2 13 9 20 9"/>
    </svg>
  </button>

  <!-- Search -->
  <button
    class="activity-btn"
    class:active={activePanel === "search"}
    onclick={() => activate("search")}
    title="Search (Ctrl+Shift+F)"
    aria-label="Search"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  </button>

  <!-- Graph -->
  <button
    class="activity-btn"
    class:active={activePanel === "graph"}
    onclick={() => activate("graph")}
    title="Graph view (Ctrl+G)"
    aria-label="Graph view"
  >
    <!-- Network/nodes icon -->
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="5" r="2"/>
      <circle cx="5" cy="19" r="2"/>
      <circle cx="19" cy="19" r="2"/>
      <line x1="12" y1="7" x2="5" y2="17"/>
      <line x1="12" y1="7" x2="19" y2="17"/>
      <line x1="5" y1="19" x2="19" y2="19"/>
    </svg>
  </button>

  <!-- Backlinks -->
  <button
    class="activity-btn"
    class:active={activePanel === "backlinks"}
    onclick={() => activate("backlinks")}
    title="Backlinks (Ctrl+.)"
    aria-label="Backlinks"
  >
    <!-- Link/chain icon -->
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  </button>

  <!-- Spacer pushes the Help button to the bottom of the bar -->
  <div class="activity-spacer" aria-hidden="true"></div>

  <!-- Help — sits below a visual divider at the bottom -->
  <button
    class="activity-btn"
    onclick={() => activate("help")}
    title="Help (Ctrl+?)"
    aria-label="Help"
  >
    <!-- Circle with question mark -->
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  </button>
</nav>

<style>
  .activity-bar {
    width: 48px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 8px;
    padding-bottom: 4px;
    gap: 2px;
    /* Slightly darker than --surface to create depth, matching VS Code */
    background: var(--bg);
    border-right: 1px solid var(--border);
  }

  /* Grows to fill remaining space, pushing the Help button to the bottom */
  .activity-spacer {
    flex: 1;
  }

  .activity-btn {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    position: relative;
    color: var(--text-muted);
    transition: color 0.12s ease;
    border-radius: 0;
    /* Left accent bar for active state, rendered via pseudo-element */
  }

  .activity-btn::before {
    content: "";
    position: absolute;
    left: 0;
    top: 25%;
    height: 50%;
    width: 2px;
    background: var(--accent);
    border-radius: 0 2px 2px 0;
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  .activity-btn:hover {
    color: var(--text);
  }

  .activity-btn.active {
    color: var(--text);
  }

  .activity-btn.active::before {
    opacity: 1;
  }
</style>
