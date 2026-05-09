<script lang="ts">
  import FileTreeNode from "./FileTreeNode.svelte";
  import ContextMenu from "./ContextMenu.svelte";
  import { activeFile, loadDir, openFile, expandedDirs, childrenByDir, deleteFileAction } from "$lib/stores/vault";
  import { api } from "$lib/services/api";
  import { downloadFile, downloadFolder } from "$lib/services/download";
  import type { FileEntry } from "$lib/services/api";

  let { entry, depth = 0 }: { entry: FileEntry; depth?: number } = $props();

  // Derived values reference props inside $derived so Svelte 5 tracks them reactively
  const isDir = $derived(entry.type === "dir");
  const paddingLeft = $derived(12 + depth * 16);

  // Context menu state
  let contextMenuOpen = $state(false);
  let contextMenuX = $state(0);
  let contextMenuY = $state(0);

  // Expand a directory on first click by loading its contents lazily
  async function toggleDir() {
    const isExpanded = $expandedDirs.has(entry.path);
    if (isExpanded) {
      expandedDirs.update((s) => { s.delete(entry.path); return new Set(s); });
    } else {
      expandedDirs.update((s) => { s.add(entry.path); return new Set(s); });
      // Only fetch if we haven't loaded this dir yet
      if (!$childrenByDir.has(entry.path)) {
        await loadDir(entry.path);
      }
    }
  }

  function handleFileClick() {
    openFile(entry.path);
  }

  function openContextMenu(e: MouseEvent) {
    e.preventDefault();
    contextMenuX = e.clientX;
    contextMenuY = e.clientY;
    contextMenuOpen = true;
  }

  // Derive the parent directory path from the entry's path so we can reload it after mutations
  function parentDir(path: string): string {
    return path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
  }

  async function handleRename() {
    const currentName = entry.name;
    const newName = prompt("Rename to:", currentName);
    if (!newName || newName === currentName) return;

    // Keep the same parent directory, only swap the filename/dirname
    const dir = parentDir(entry.path);
    const newPath = dir ? `${dir}/${newName}` : newName;

    await api.files.move(entry.path, newPath);
    // Reload the parent so the tree reflects the new name
    await loadDir(parentDir(entry.path));
  }

  async function handleDelete() {
    const confirmed = confirm(
      `Delete "${entry.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    await deleteFileAction(entry.path);
  }

  // File context menu shows Open, Download, Rename, Delete
  const fileMenuItems = [
    { label: "Open", icon: "open", action: () => openFile(entry.path) },
    { label: "Download", icon: "download", action: () => downloadFile(entry.path) },
    { label: "Rename", icon: "rename", action: handleRename },
    { label: "Delete", icon: "delete", danger: true, action: handleDelete },
  ];

  // Directory context menu shows Download ZIP, Rename, Delete
  const dirMenuItems = [
    { label: "Download ZIP", icon: "download", action: () => downloadFolder(entry.path) },
    { label: "Rename", icon: "rename", action: handleRename },
    { label: "Delete", icon: "delete", danger: true, action: handleDelete },
  ];
</script>

{#if isDir}
  <!-- Directory row — mx-1 keeps hover highlight away from sidebar edges -->
  <button
    onclick={toggleDir}
    oncontextmenu={openContextMenu}
    class="flex items-center gap-1.5 mx-1 text-left text-sm transition-colors hover:bg-[var(--surface-hover)] rounded-md cursor-pointer"
    style="min-height: 32px; width: calc(100% - 8px); padding-left: {paddingLeft - 4}px; padding-right: 8px; color: var(--text);"
    aria-expanded={$expandedDirs.has(entry.path)}
  >
    <!-- Chevron rotates when expanded -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="flex-shrink: 0; transition: transform 0.15s; transform: rotate({$expandedDirs.has(entry.path) ? 90 : 0}deg);"
    >
      <polyline points="9 18 15 12 9 6"/>
    </svg>
    <!-- Folder icon -->
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
      style="flex-shrink: 0; color: var(--accent);"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="truncate">{entry.name}</span>
  </button>

  <!-- Render children recursively when expanded -->
  {#if $expandedDirs.has(entry.path) && $childrenByDir.has(entry.path)}
    {#each $childrenByDir.get(entry.path)! as child (child.path)}
      <FileTreeNode entry={child} depth={depth + 1} />
    {/each}
  {/if}
{:else}
  <!-- File row — left border accent makes the active file more prominent -->
  <button
    onclick={handleFileClick}
    oncontextmenu={openContextMenu}
    class="flex items-center gap-1.5 mx-1 text-left text-sm transition-colors hover:bg-[var(--surface-hover)] rounded-md cursor-pointer"
    style="min-height: 32px; width: calc(100% - 8px); padding-left: {$activeFile === entry.path ? paddingLeft - 6 : paddingLeft - 4}px; padding-right: 8px;
           color: {$activeFile === entry.path ? 'var(--accent)' : 'var(--text)'};
           background: {$activeFile === entry.path ? 'var(--accent-dim)' : 'transparent'};
           border-left: {$activeFile === entry.path ? '2px solid var(--accent)' : '2px solid transparent'};"
    aria-current={$activeFile === entry.path ? 'page' : undefined}
  >
    <!-- File icon -->
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
      style="flex-shrink: 0; opacity: 0.7;"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
    <span class="truncate">{entry.name}</span>
  </button>
{/if}

<!-- Context menu rendered outside the button flow to avoid stacking context issues -->
<ContextMenu
  x={contextMenuX}
  y={contextMenuY}
  items={isDir ? dirMenuItems : fileMenuItems}
  bind:open={contextMenuOpen}
/>
