import {
  EditorView,
  ViewPlugin,
  DecorationSet,
  Decoration,
  ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

// Matches #tagname — same regex the server indexer uses.
// Negative lookbehind prevents matching inside words (e.g. "c#code").
const TAG_RE = /(?<![a-zA-Z0-9_])#([a-zA-Z_][a-zA-Z0-9_/\-]*)/g;

export const tagDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const doc = view.state.doc;

      for (const { from, to } of view.visibleRanges) {
        const text = doc.sliceString(from, to);

        // Skip tags inside headings (lines starting with #)
        // We process line-by-line so heading lines are excluded
        let lineStart = from;
        for (let i = 0; i < text.length; i++) {
          if (text[i] === "\n" || i === text.length - 1) {
            const lineEnd = i === text.length - 1 ? from + i + 1 : from + i;
            const lineText = doc.sliceString(lineStart, lineEnd);

            // Skip heading lines and fenced code markers
            if (!/^#{1,6}\s/.test(lineText) && !/^```/.test(lineText)) {
              TAG_RE.lastIndex = 0;
              let m: RegExpExecArray | null;

              while ((m = TAG_RE.exec(lineText)) !== null) {
                const start = lineStart + m.index;
                const end = start + m[0].length;
                const tag = m[1];

                builder.add(
                  start,
                  end,
                  Decoration.mark({
                    class: "cm-tag-link",
                    attributes: { "data-tag": tag },
                  })
                );
              }
            }

            lineStart = from + i + 1;
          }
        }
      }

      return builder.finish();
    }
  },
  { decorations: (v) => v.decorations }
);

export const tagStyles = EditorView.baseTheme({
  ".cm-tag-link": {
    color: "var(--accent)",
    cursor: "pointer",
    borderRadius: "3px",
    padding: "0 2px",
    margin: "0 1px",
    backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
    transition: "background-color 0.1s ease",
  },
  ".cm-tag-link:hover": {
    backgroundColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
  },
});

export function tagClickHandler(onTagClick: (tag: string) => void) {
  return EditorView.domEventHandlers({
    click(event: MouseEvent) {
      const el = (event.target as HTMLElement).closest(".cm-tag-link") as HTMLElement | null;
      if (!el) return false;

      const tag = el.dataset["tag"];
      if (!tag) return false;

      event.preventDefault();
      onTagClick(tag);
      return true;
    },
  });
}
