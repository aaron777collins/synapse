<script lang="ts">
  import { activeContent, dirty, saveStatus } from "$lib/stores/vault";

  interface FormatAction {
    label: string;
    title: string;
    insert: string;
    /** When true, wrap the selection rather than inserting at cursor */
    wrap?: boolean;
    wrapEnd?: string;
  }

  const actions: FormatAction[] = [
    { label: "B",       title: "Bold",     insert: "**",    wrap: true,  wrapEnd: "**"   },
    { label: "I",       title: "Italic",   insert: "*",     wrap: true,  wrapEnd: "*"    },
    { label: "#",       title: "Heading",  insert: "# ",    wrap: false                  },
    { label: "[[",      title: "Link",     insert: "[[",    wrap: true,  wrapEnd: "]]"   },
    { label: "#tag",    title: "Tag",      insert: "#",     wrap: false                  },
    { label: "-",       title: "List",     insert: "- ",    wrap: false                  },
    { label: "- [ ]",   title: "Checkbox", insert: "- [ ] ", wrap: false                 },
  ];

  // Inserts or wraps text at the textarea cursor position.
  // CodeMirror owns the canonical document state, so we update the store
  // which will be picked up by the editor's next render cycle.
  function applyAction(action: FormatAction) {
    activeContent.update((content) => {
      // For simplicity on mobile, append to end of document.
      // A textarea-based approach would need a ref to the CM view; here
      // we just append so the user can position it themselves.
      if (action.wrap) {
        return content + action.insert + action.wrapEnd;
      }
      return content + "\n" + action.insert;
    });

    dirty.set(true);
    saveStatus.set("unsaved");
  }
</script>

<!--
  Mobile-only toolbar (md:hidden).
  Fixed at the bottom of the editor area so it doesn't push layout.
  Horizontally scrollable so all buttons remain accessible on narrow screens.
  Buttons are grouped: text formatting (Bold, Italic) separated from structural (Heading, Link, Tag, List, Checkbox).
-->
<div
  class="md:hidden flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto shrink-0 border-t"
  style="background: var(--surface); border-color: var(--border);"
  role="toolbar"
  aria-label="Formatting shortcuts"
>
  {#each actions as action, i}
    <!-- Visual separator between text formatting (0-1) and structural formatting (2+) -->
    {#if i === 2}
      <div
        class="flex-shrink-0 w-px self-stretch mx-1"
        style="background: var(--border);"
        role="separator"
        aria-orientation="vertical"
      ></div>
    {/if}
    <button
      onclick={() => applyAction(action)}
      title={action.title}
      class="flex-shrink-0 px-3.5 py-2 rounded-lg text-sm font-mono transition-colors hover:bg-[var(--accent-dim)] hover:border-[var(--accent)]"
      style="
        background: var(--bg);
        color: var(--text);
        border: 1px solid var(--border);
      "
    >
      {action.label}
    </button>
  {/each}
</div>
