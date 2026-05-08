<script lang="ts">
  import { tagNoteData, tagNoteLoading, tagNoteError, refreshTagNote } from "$lib/stores/tagNote";
  import { openFile } from "$lib/stores/vault";
  import { basename, stripExtension } from "$lib/utils/paths";

  function handleFileClick(path: string) {
    openFile(path);
  }

  /**
   * Escape HTML special characters and then wrap every occurrence of `#tag`
   * with a highlight span.  Escaping first prevents XSS from note content
   * while still letting us inject the single trusted span element.
   */
  function highlightTag(content: string, tag: string): string {
    const escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const re = new RegExp(`(#${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return escaped.replace(re, '<span class="tag-highlight">$1</span>');
  }
</script>

<div class="tag-note-shell">
  {#if $tagNoteLoading}
    <!-- Loading state — centred spinner keeps the view calm while data arrives -->
    <div class="state-message">
      <div class="spinner" aria-label="Loading tag note"></div>
      <p>Loading tag note…</p>
    </div>

  {:else if $tagNoteError}
    <!-- Error state — surface the message so the user can act on it -->
    <div class="state-message error">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{$tagNoteError}</p>
      <button class="retry-btn" onclick={refreshTagNote}>Retry</button>
    </div>

  {:else if $tagNoteData}
    {@const data = $tagNoteData}

    <!-- Header bar — same visual weight as the Editor's top bar -->
    <div class="header-bar">
      <span class="header-tag">
        <span class="header-hash">#</span>{data.tag}
      </span>
      <span class="header-meta">
        {data.fileCount} {data.fileCount === 1 ? "file" : "files"} · {data.paragraphCount} {data.paragraphCount === 1 ? "paragraph" : "paragraphs"}
      </span>
      <button
        class="refresh-btn"
        onclick={refreshTagNote}
        title="Refresh tag note"
        aria-label="Refresh tag note"
      >
        <!-- Circular refresh arrow icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      </button>
    </div>

    <!-- Scrollable section list fills the remaining vertical space -->
    <div class="sections-scroll">
      {#if data.sections.length === 0}
        <div class="state-message">
          <p>No paragraphs found for <strong>#{data.tag}</strong>.</p>
        </div>
      {:else}
        <div class="sections-inner">
          {#each data.sections as section (section.filePath)}
            <div class="section-card">
              <!-- Clickable file header — navigates to the source file -->
              <button
                class="section-header"
                onclick={() => handleFileClick(section.filePath)}
                title={section.filePath}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="file-icon">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span class="file-name">{stripExtension(basename(section.filePath))}</span>
                <span class="file-ext">.md</span>
              </button>

              <div class="section-body">
                <!-- Nearest heading gives context without cluttering the paragraphs -->
                {#if section.heading}
                  <div class="heading-context" aria-label="Nearest heading">
                    <span class="heading-marker">›</span>
                    <span class="heading-text">{section.heading}</span>
                  </div>
                {/if}

                {#each section.paragraphs as para (para.lineNumber)}
                  <div class="paragraph-block">
                    <span class="line-number" title="Line {para.tagLineNumber}">Ln {para.tagLineNumber}</span>
                    <!-- {@html} is safe here: content is escaped before highlight spans are injected -->
                    <p class="paragraph-text">{@html highlightTag(para.content, data.tag)}</p>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  {:else}
    <!-- Fallback: data is null but we're not loading or erroring -->
    <div class="state-message">
      <p style="color: var(--text-muted);">Select a tag to view its aggregated note.</p>
    </div>
  {/if}
</div>

<style>
  .tag-note-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--bg);
    animation: fadeIn 0.15s ease-out;
  }

  /* ── Header bar ───────────────────────────────────────────────────── */
  .header-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    height: 42px;
    flex-shrink: 0;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }

  .header-tag {
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
    /* Left accent rule mirrors the Editor's file path bar */
    border-left: 2px solid var(--accent);
    padding-left: 8px;
  }

  .header-hash {
    color: var(--accent);
  }

  .header-meta {
    color: var(--text-muted);
    font-size: 12px;
    flex: 1;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.1s ease, background 0.1s ease;
    flex-shrink: 0;
  }

  .refresh-btn:hover {
    color: var(--accent);
    background: var(--accent-dim);
  }

  /* ── Scrollable content area ──────────────────────────────────────── */
  .sections-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .sections-inner {
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 860px;
    margin: 0 auto;
  }

  /* ── Section cards ────────────────────────────────────────────────── */
  .section-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    overflow: hidden;
    transition: border-color 0.15s ease;
  }

  .section-card:hover {
    border-color: var(--accent);
  }

  /* File name header — the entire strip is the click target */
  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 14px;
    background: var(--surface-hover);
    border: none;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    text-align: left;
    font-size: 12px;
    color: var(--accent);
    transition: color 0.1s ease, background 0.1s ease;
  }

  .section-header:hover {
    background: var(--accent-dim);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .file-icon {
    flex-shrink: 0;
    opacity: 0.7;
  }

  .file-name {
    font-weight: 600;
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .file-ext {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 11px;
  }

  /* ── Section body ─────────────────────────────────────────────────── */
  .section-body {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* Nearest heading — blockquote-style so it reads as contextual, not content */
  .heading-context {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 4px 0 4px 10px;
    border-left: 2px solid var(--border);
    font-size: 12px;
    font-style: italic;
    color: var(--text-muted);
  }

  .heading-marker {
    font-style: normal;
    font-size: 14px;
    line-height: 1;
    color: var(--border);
  }

  .heading-text {
    white-space: pre-wrap;
  }

  /* ── Paragraph block ──────────────────────────────────────────────── */
  .paragraph-block {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .line-number {
    flex-shrink: 0;
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    opacity: 0.6;
    padding-top: 1px;
    min-width: 44px;
    text-align: right;
    user-select: none;
  }

  .paragraph-text {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.65;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
    flex: 1;
    min-width: 0;
  }

  /* Tag highlight — injected via {@html}; scoped via :global since the span
     lives inside innerHTML, not in the Svelte template tree */
  .paragraph-text :global(.tag-highlight) {
    color: var(--accent);
    background: var(--accent-dim);
    border-radius: 3px;
    padding: 0 3px;
    font-weight: 600;
  }

  /* ── State messages (loading / error / empty) ─────────────────────── */
  .state-message {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 48px 16px;
    color: var(--text-muted);
    font-size: 14px;
    text-align: center;
  }

  .state-message.error {
    color: #ef4444;
  }

  .retry-btn {
    margin-top: 4px;
    padding: 6px 16px;
    border-radius: 6px;
    border: 1px solid #ef4444;
    background: transparent;
    color: #ef4444;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.1s ease, color 0.1s ease;
  }

  .retry-btn:hover {
    background: #ef444420;
  }

  /* ── Spinner ──────────────────────────────────────────────────────── */
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
