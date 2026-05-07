import { EditorView } from "@codemirror/view";

export const synapseThemeDark = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--bg)",
      color: "var(--text)",
      fontSize: "15px",
      fontFamily: "var(--font-mono)",
    },
    ".cm-content": {
      caretColor: "var(--accent)",
      lineHeight: "1.6",
      padding: "16px 0",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--accent)",
      borderLeftWidth: "2px",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--surface)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "var(--accent-dim) !important",
    },
    ".cm-gutters": {
      backgroundColor: "var(--bg)",
      color: "var(--text-muted)",
      border: "none",
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--surface)",
      color: "var(--text)",
    },
    ".cm-line": {
      padding: "0 16px",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--accent-dim) !important",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
  },
  { dark: true }
);
