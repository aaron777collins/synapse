<script lang="ts">
  import { marked } from "marked";
  import hljs from "highlight.js/lib/common";
  import "highlight.js/styles/github-dark.min.css";
  import { navigateToLink } from "$lib/stores/vault";
  import { openTagNote } from "$lib/stores/tagNote";

  const TAG_RE = /(?<![a-zA-Z0-9_])#([a-zA-Z_][a-zA-Z0-9_/\-]*)/g;
  const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

  let previewEl: HTMLDivElement | undefined = $state(undefined);

  // Custom renderer that turns wikilinks and tags into clickable elements
  const renderer = new marked.Renderer();

  const origText = renderer.text.bind(renderer);
  renderer.text = function (token) {
    let text = typeof token === "string" ? token : origText(token);

    // Replace [[wikilinks]] with styled spans
    text = text.replace(WIKILINK_RE, (_match: string, target: string) => {
      return `<span class="preview-wikilink" data-target="${target.replace(/"/g, '&quot;')}">[[${target}]]</span>`;
    });

    // Replace #tags with styled spans
    text = text.replace(TAG_RE, (match: string, tag: string) => {
      return `<span class="preview-tag" data-tag="${tag.replace(/"/g, '&quot;')}">${match}</span>`;
    });

    return text;
  };

  renderer.code = function ({ text, lang }: { text: string; lang?: string; escaped?: boolean }) {
    let highlighted: string;
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(text, { language: lang }).value;
    } else {
      highlighted = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
    const cls = lang ? `language-${lang} hljs` : "hljs";
    return `<pre><code class="${cls}">${highlighted}</code></pre>\n`;
  };

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true,
  });

  let { content = "" }: { content?: string } = $props();

  let html = $derived(marked.parse(content) as string);

  function handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    const wikilink = target.closest(".preview-wikilink") as HTMLElement | null;
    if (wikilink?.dataset["target"]) {
      e.preventDefault();
      navigateToLink(wikilink.dataset["target"]);
      return;
    }

    const tag = target.closest(".preview-tag") as HTMLElement | null;
    if (tag?.dataset["tag"]) {
      e.preventDefault();
      openTagNote(tag.dataset["tag"]);
      return;
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="preview-shell"
  bind:this={previewEl}
  onclick={handleClick}
>
  <div class="preview-content">
    {@html html}
  </div>
</div>

<style>
  .preview-shell {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg);
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .preview-content {
    max-width: 780px;
    margin: 0 auto;
    padding: 32px 40px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 15px;
    line-height: 1.75;
    color: var(--text);
    animation: fadeIn 0.12s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(2px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Typography ───────────────────────────────────── */
  .preview-content :global(h1) {
    font-size: 1.9em;
    font-weight: 700;
    margin: 0 0 0.6em 0;
    padding-bottom: 0.25em;
    border-bottom: 2px solid var(--border);
    color: var(--text);
    letter-spacing: -0.02em;
  }

  .preview-content :global(h2) {
    font-size: 1.45em;
    font-weight: 600;
    margin: 1.6em 0 0.5em 0;
    padding-bottom: 0.2em;
    border-bottom: 1px solid var(--border);
    color: var(--text);
  }

  .preview-content :global(h3) {
    font-size: 1.2em;
    font-weight: 600;
    margin: 1.4em 0 0.4em 0;
    color: var(--text);
  }

  .preview-content :global(h4),
  .preview-content :global(h5),
  .preview-content :global(h6) {
    font-size: 1em;
    font-weight: 600;
    margin: 1.2em 0 0.3em 0;
    color: var(--text-muted);
  }

  .preview-content :global(p) {
    margin: 0 0 1em 0;
  }

  .preview-content :global(a) {
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
    transition: border-color 0.1s ease;
  }

  .preview-content :global(a:hover) {
    border-bottom-color: var(--accent);
  }

  .preview-content :global(strong) {
    font-weight: 700;
    color: var(--text);
  }

  .preview-content :global(em) {
    font-style: italic;
  }

  /* ── Blockquotes ──────────────────────────────────── */
  .preview-content :global(blockquote) {
    margin: 1em 0;
    padding: 0.6em 1em;
    border-left: 3px solid var(--accent);
    background: var(--surface);
    border-radius: 0 6px 6px 0;
    color: var(--text-muted);
  }

  .preview-content :global(blockquote p) {
    margin: 0;
  }

  /* ── Lists ────────────────────────────────────────── */
  .preview-content :global(ul),
  .preview-content :global(ol) {
    margin: 0 0 1em 0;
    padding-left: 1.6em;
  }

  .preview-content :global(li) {
    margin-bottom: 0.3em;
  }

  .preview-content :global(li::marker) {
    color: var(--accent);
  }

  /* Checkboxes */
  .preview-content :global(input[type="checkbox"]) {
    accent-color: var(--accent);
    margin-right: 6px;
    transform: scale(1.1);
    vertical-align: middle;
  }

  /* ── Code ─────────────────────────────────────────── */
  .preview-content :global(code) {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
    font-size: 0.87em;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 5px;
    color: var(--accent);
  }

  .preview-content :global(pre) {
    margin: 1em 0;
    padding: 16px 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow-x: auto;
    line-height: 1.5;
  }

  .preview-content :global(pre code) {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.85em;
    color: var(--text);
  }

  .preview-content :global(pre code.hljs) {
    background: none;
    padding: 0;
  }

  /* ── Tables ───────────────────────────────────────── */
  .preview-content :global(table) {
    width: 100%;
    margin: 1em 0;
    border-collapse: collapse;
    font-size: 0.9em;
  }

  .preview-content :global(th) {
    text-align: left;
    padding: 8px 12px;
    background: var(--surface);
    border-bottom: 2px solid var(--border);
    font-weight: 600;
    color: var(--text);
  }

  .preview-content :global(td) {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }

  .preview-content :global(tr:hover td) {
    background: var(--surface);
  }

  /* ── Horizontal rule ──────────────────────────────── */
  .preview-content :global(hr) {
    margin: 2em 0;
    border: none;
    height: 1px;
    background: var(--border);
  }

  /* ── Images ───────────────────────────────────────── */
  .preview-content :global(img) {
    max-width: 100%;
    border-radius: 8px;
    margin: 1em 0;
  }

  /* ── Wikilinks ────────────────────────────────────── */
  .preview-content :global(.preview-wikilink) {
    color: var(--accent);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: opacity 0.1s ease;
  }

  .preview-content :global(.preview-wikilink:hover) {
    opacity: 0.8;
  }

  /* ── Tags ─────────────────────────────────────────── */
  .preview-content :global(.preview-tag) {
    color: var(--accent);
    cursor: pointer;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border-radius: 4px;
    padding: 1px 5px;
    font-weight: 500;
    transition: background 0.1s ease;
  }

  .preview-content :global(.preview-tag:hover) {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
  }
</style>
