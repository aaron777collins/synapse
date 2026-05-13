<script lang="ts">
  import { onMount } from "svelte";
  import AppShell from "$lib/components/AppShell.svelte";
  import QuickSwitcher from "$lib/components/QuickSwitcher.svelte";
  import EnhancedQuickSwitcher from "$lib/components/EnhancedQuickSwitcher.svelte";
  import HelpPanel from "$lib/components/HelpPanel.svelte";
  import { registerKeybinding, initKeybindings } from "$lib/services/keybindings";
  import { initFromUrl } from "$lib/services/history";
  import { sidebarOpen, backlinksOpen, graphOpen, helpOpen } from "$lib/stores/ui";
  import { focusedPaneId, setPaneMode, savePaneFile, focusedPane } from "$lib/stores/panes";
  import { get } from "svelte/store";

  let quickSwitcherOpen = $state(false);
  let enhancedSwitcherOpen = $state(false);
  // Local state mirrors the helpOpen store so HelpPanel's bindable prop can write back here,
  // while the store drives opens from the ActivityBar and the keybinding.
  let helpPanelOpen = $state(false);

  // Keep local state in sync with store (store is the source of truth for opens)
  $effect(() => { helpPanelOpen = $helpOpen; });
  // When the panel closes itself (Esc / backdrop click), push the change back to the store
  $effect(() => { helpOpen.set(helpPanelOpen); });

  onMount(() => {
    initFromUrl();
    registerKeybinding("mod+k", () => (enhancedSwitcherOpen = !enhancedSwitcherOpen));
    registerKeybinding("mod+shift+k", () => (quickSwitcherOpen = !quickSwitcherOpen));
    registerKeybinding("mod+s", () => savePaneFile(get(focusedPaneId)));
    registerKeybinding("mod+\\", () => sidebarOpen.update((v) => !v));
    registerKeybinding("mod+.", () => backlinksOpen.update((v) => !v));
    registerKeybinding("mod+g", () => graphOpen.update((v) => !v));
    registerKeybinding("mod+shift+f", () => {
      sidebarOpen.set(true);
      setTimeout(
        () => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus(),
        100
      );
    });
    // Ctrl+? is Ctrl+Shift+/ on most keyboards; mod+shift+/ covers both
    registerKeybinding("mod+shift+/", () => helpOpen.update((v) => !v));
    registerKeybinding("mod+e", () => {
      const pane = get(focusedPane);
      setPaneMode(pane.id, pane.mode === "edit" ? "preview" : "edit");
    });
    initKeybindings();
  });
</script>

<AppShell />
<EnhancedQuickSwitcher bind:open={enhancedSwitcherOpen} />
<QuickSwitcher bind:open={quickSwitcherOpen} />
{#if $graphOpen}
  {#await import("$lib/components/GraphView.svelte") then mod}
    {@const GraphView = mod.default}
    <GraphView />
  {/await}
{/if}
<HelpPanel bind:open={helpPanelOpen} />
