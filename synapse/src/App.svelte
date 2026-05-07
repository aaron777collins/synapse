<script lang="ts">
  import { onMount } from "svelte";
  import AppShell from "$lib/components/AppShell.svelte";
  import QuickSwitcher from "$lib/components/QuickSwitcher.svelte";
  import GraphView from "$lib/components/GraphView.svelte";
  import HelpPanel from "$lib/components/HelpPanel.svelte";
  import { registerKeybinding, initKeybindings } from "$lib/services/keybindings";
  import { sidebarOpen, backlinksOpen, graphOpen, helpOpen } from "$lib/stores/ui";
  import { saveFile } from "$lib/stores/vault";

  let quickSwitcherOpen = $state(false);
  // Local state mirrors the helpOpen store so HelpPanel's bindable prop can write back here,
  // while the store drives opens from the ActivityBar and the keybinding.
  let helpPanelOpen = $state(false);

  // Keep local state in sync with store (store is the source of truth for opens)
  $effect(() => { helpPanelOpen = $helpOpen; });
  // When the panel closes itself (Esc / backdrop click), push the change back to the store
  $effect(() => { helpOpen.set(helpPanelOpen); });

  onMount(() => {
    registerKeybinding("mod+k", () => (quickSwitcherOpen = !quickSwitcherOpen));
    registerKeybinding("mod+s", () => saveFile());
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
    initKeybindings();
  });
</script>

<AppShell />
<QuickSwitcher bind:open={quickSwitcherOpen} />
<GraphView />
<HelpPanel bind:open={helpPanelOpen} />
