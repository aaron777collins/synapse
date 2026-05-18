# Synapse — LLM Wiki Integration

Synapse is a web-based knowledge management app (Svelte 5, CodeMirror 6, d3-force graph).
It serves as the **browsing interface** for the LLM Wiki.

## LLM Wiki Pattern

This project follows [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
The LLM incrementally builds and maintains a persistent wiki rather than doing stateless RAG.

### Central Wiki Location

The canonical LLM Wiki lives at: `/home/ubuntu/topics/aibrain/`

```
aibrain/
├── raw/            # Immutable source documents
│   └── assets/     # Downloaded images/media
├── wiki/           # LLM-maintained markdown pages
│   ├── index.md    # Content catalog
│   └── log.md      # Chronological operation log
└── CLAUDE.md       # Full wiki schema and workflows
```

### How Synapse Connects

Synapse can serve the wiki directory for browsing:
```bash
node server/index.js --vault /home/ubuntu/topics/aibrain/wiki
```

The wiki uses `[[Page Name]]` links, which Synapse natively supports with:
- Click-to-navigate
- Backlinks panel
- Graph view for visualizing the knowledge graph
- Full-text search across all pages

### Your Role as LLM

When working in this project:

1. **If the user asks to add/ingest information**: Follow the ingest workflow in
   `/home/ubuntu/topics/aibrain/CLAUDE.md` — create source summaries, update entity/concept
   pages, maintain cross-references, update index.md and log.md.

2. **If the user asks questions**: Check `wiki/index.md` first, read relevant pages,
   synthesize answers with `[[citations]]`. File valuable answers back as wiki pages.

3. **If asked to lint/maintain**: Check for contradictions, orphan pages, missing links,
   stale content.

4. **If working on Synapse code**: Normal development — the wiki schema doesn't apply to
   code changes, only to content workflows.

## Dev Commands

```bash
npm run dev        # Vite dev server (port 5174)
npm run dev:server # API server (port 5173)
npm test           # Unit tests
npm run test:e2e   # E2E tests
npm run build      # Production build
```
