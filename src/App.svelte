<script lang="ts">
  import { onMount } from "svelte";
  import AppShell from "$lib/components/AppShell.svelte";
  import QuickSwitcher from "$lib/components/QuickSwitcher.svelte";
  import GraphView from "$lib/components/GraphView.svelte";
  import { registerKeybinding, initKeybindings } from "$lib/services/keybindings";
  import { sidebarOpen, backlinksOpen, graphOpen } from "$lib/stores/ui";
  import { saveFile } from "$lib/stores/vault";

  let quickSwitcherOpen = $state(false);

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
    initKeybindings();
  });
</script>

<AppShell />
<QuickSwitcher bind:open={quickSwitcherOpen} />
<GraphView />
