import {
  EditorView,
  ViewPlugin,
  DecorationSet,
  Decoration,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { RangeSetBuilder } from "@codemirror/state";

// Matches [[LinkTarget]] — captures the inner text without brackets
const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

/**
 * Provides autocomplete for [[ wikilink syntax.
 * Triggers on [[ and completes with the note base name followed by ]].
 * getFiles must return the current list of all known .md paths.
 */
export function wikilinkAutocomplete(getFiles: () => string[]) {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        // Match from the last [[ up to (but not including) any ]] or end of line
        const match = context.matchBefore(/\[\[[^\]]*$/);
        if (!match) return null;

        // Don't open unless explicitly requested or the user just typed [[
        if (match.from === match.to && !context.explicit) return null;

        // The text already typed after [[
        const typed = match.text.slice(2); // strip the leading [[

        const files = getFiles();
        const options = files
          .filter((f) => f.endsWith(".md"))
          .map((f) => {
            // Use just the base name without extension as the display label
            const slashIdx = f.lastIndexOf("/");
            const base = slashIdx === -1 ? f : f.substring(slashIdx + 1);
            const label = base.replace(/\.md$/i, "");
            return {
              label,
              apply: `${label}]]`,
              detail: f,
              boost: label.toLowerCase().startsWith(typed.toLowerCase()) ? 1 : 0,
            };
          });

        return {
          from: match.from + 2, // start right after [[
          options,
          validFor: /^[^\]]*$/,
        };
      },
    ],
  });
}

/**
 * A no-op WidgetType placeholder — we use mark decorations (not widgets) for
 * wikilinks but ViewPlugin.define requires importing WidgetType; keeping it
 * here avoids a dead-import lint warning in strict mode.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class _Unused extends WidgetType {
  toDOM() { return document.createElement("span"); }
}

/**
 * Scans the visible document for [[...]] patterns and applies a
 * `.cm-wikilink` mark decoration to each one so CSS can style them.
 * The link target is stored in a `data-target` attribute so the click
 * handler can read it without re-parsing the text.
 */
export const wikilinkDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      // Rebuild whenever the document or viewport changes
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const doc = view.state.doc;

      for (const { from, to } of view.visibleRanges) {
        const text = doc.sliceString(from, to);
        WIKILINK_RE.lastIndex = 0;
        let m: RegExpExecArray | null;

        while ((m = WIKILINK_RE.exec(text)) !== null) {
          const start = from + m.index;
          const end = start + m[0].length;
          const target = m[1];

          builder.add(
            start,
            end,
            Decoration.mark({
              class: "cm-wikilink",
              attributes: { "data-target": target },
            })
          );
        }
      }

      return builder.finish();
    }
  },
  { decorations: (v) => v.decorations }
);

/**
 * Base theme for wikilinks — uses CSS variables so it adapts to both
 * the dark and light Synapse themes without duplicating rules.
 */
export const wikilinkStyles = EditorView.baseTheme({
  ".cm-wikilink": {
    color: "var(--accent)",
    textDecoration: "underline",
    cursor: "pointer",
  },
});

/**
 * Click handler for wikilinks.
 * - Desktop (viewport >= 768 px): requires Ctrl or Cmd held down.
 * - Mobile (viewport < 768 px): plain tap is enough.
 *
 * Walks up the DOM from the click target to find the nearest element
 * carrying the `.cm-wikilink` class, reads its `data-target`, and
 * calls onNavigate so the vault store can open or create the note.
 */
export function wikilinkClickHandler(onNavigate: (target: string) => void) {
  return EditorView.domEventHandlers({
    click(event: MouseEvent) {
      const isMobile = window.innerWidth < 768;
      const needsModifier = !isMobile;

      if (needsModifier && !event.ctrlKey && !event.metaKey) return false;

      const el = (event.target as HTMLElement).closest(".cm-wikilink") as HTMLElement | null;
      if (!el) return false;

      const target = el.dataset["target"];
      if (!target) return false;

      event.preventDefault();
      onNavigate(target);
      return true;
    },
  });
}
