import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting, type LanguageDescription } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const markdownHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.heading1, color: "var(--accent)", fontWeight: "700", fontSize: "1.6em" },
    { tag: tags.heading2, color: "var(--accent)", fontWeight: "600", fontSize: "1.4em" },
    { tag: tags.heading3, color: "var(--accent)", fontWeight: "600", fontSize: "1.2em" },
    { tag: tags.heading4, color: "var(--accent)", fontWeight: "600", fontSize: "1.1em" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strong, fontWeight: "bold" },
    { tag: tags.link, color: "var(--accent)", textDecoration: "underline" },
    { tag: tags.url, color: "var(--text-muted)" },
    { tag: tags.monospace, color: "#e879f9", fontFamily: "var(--font-mono)" },
    { tag: tags.meta, color: "var(--text-muted)" },
    { tag: tags.quote, color: "var(--text-muted)", fontStyle: "italic" },
    { tag: tags.list, color: "var(--accent)" },
  ])
);

let cachedLanguages: LanguageDescription[] | null = null;

export async function loadCodeLanguages(): Promise<LanguageDescription[]> {
  if (cachedLanguages) return cachedLanguages;
  const { languages } = await import("@codemirror/language-data");
  cachedLanguages = languages;
  return languages;
}

export function createMarkdownExtensions(codeLanguages?: LanguageDescription[]) {
  return [
    markdown({ base: markdownLanguage, ...(codeLanguages ? { codeLanguages } : {}) }),
    markdownHighlighting,
  ];
}
