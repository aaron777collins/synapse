<script lang="ts">
  import { sidebarOpen } from "$lib/stores/ui";
  import { createFile, createDir } from "$lib/stores/vault";
  import { debounce } from "$lib/utils/debounce";
  import ThemeToggle from "./ThemeToggle.svelte";
  import FileTree from "./FileTree.svelte";
  import TagsPanel from "./TagsPanel.svelte";

  // Search query drives filtered display — for now stored locally;
  // wired into search store in a future task when the search panel is added.
  let searchQuery = $state("");

  const handleSearchInput = debounce((value: string) => {
    searchQuery = value;
  }, 300);

  async function handleNewNote() {
    const name = prompt("Note name:");
    if (!name?.trim()) return;
    // Append .md if the user didn't include an extension
    const path = name.endsWith(".md") ? name.trim() : `${name.trim()}.md`;
    await createFile(path);
  }

  async function handleNewFolder() {
    const name = prompt("Folder name:");
    if (!name?.trim()) return;
    await createDir(name.trim());
  }
</script>

<aside
  class="flex flex-col h-full"
  style="width: 280px; min-width: 280px; background: var(--surface); border-right: 1px solid var(--border);"
>
  <!-- Header -->
  <div
    class="flex items-center justify-between px-4 py-3"
    style="border-bottom: 1px solid var(--border);"
  >
    <span class="font-bold text-base tracking-tight" style="color: var(--accent);">Synapse</span>
    <div class="flex items-center gap-1">
      <ThemeToggle />
      <!-- Close button — only visible on mobile -->
      <button
        onclick={() => sidebarOpen.set(false)}
        class="md:hidden p-2 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
        aria-label="Close sidebar"
        style="color: var(--text-muted);"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Search -->
  <div class="px-3 py-2" style="border-bottom: 1px solid var(--border);">
    <div class="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="absolute left-2.5 top-1/2 -translate-y-1/2"
        style="color: var(--text-muted);"
      >
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text"
        placeholder="Search notes…"
        oninput={(e) => handleSearchInput((e.target as HTMLInputElement).value)}
        class="w-full text-sm rounded-md pl-8 pr-3 py-1.5 outline-none transition-colors"
        style="background: var(--bg); color: var(--text); border: 1px solid var(--border);"
      />
    </div>
  </div>

  <!-- New Note / New Folder actions -->
  <div class="flex gap-2 px-3 py-2" style="border-bottom: 1px solid var(--border);">
    <button
      onclick={handleNewNote}
      class="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-2 rounded-md transition-colors"
      style="background: var(--accent); color: #fff;"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      New Note
    </button>
    <button
      onclick={handleNewFolder}
      class="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-2 rounded-md transition-colors"
      style="background: transparent; color: var(--accent); border: 1px solid var(--accent);"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      New Folder
    </button>
  </div>

  <!-- File tree fills remaining height, tags panel anchors to the bottom -->
  <div class="flex flex-col flex-1 overflow-hidden">
    <FileTree />
    <TagsPanel />
  </div>
</aside>
