# Synapse — Design Specification

## Overview

Synapse is a web-based knowledge management application for creating, editing, and navigating interconnected markdown notes. It features bidirectional linking between notes, a tag/topics system, a visual graph of connections, full-text search, and a polished responsive UI accessible from both desktop and mobile browsers.

## Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend Framework | Svelte 5 + Vite | Small bundles, reactive, clean component model |
| UI Components | shadcn-svelte | Accessible, polished, composable |
| Styling | Tailwind CSS 4 | Utility-first, responsive, dark/light theming |
| Editor | CodeMirror 6 | Markdown syntax highlighting, mobile support, extensible autocomplete |
| Backend | Node.js (native http) | Zero-dependency server, fast startup, simple deployment |
| Testing | Vitest (unit) + Playwright (e2e) | Fast iteration + real browser coverage |
| Containerization | Docker (multi-stage) | Build frontend, serve with Node.js |

## Feature Set (Priority Order)

### P0 — Core

1. **Wiki-style links** — `[[Note Name]]` and `[[Note Name|Display Text]]` syntax. Clicking navigates to the linked note. Autocomplete on `[[` in editor.
2. **Backlinks panel** — For any open note, show all other notes that link to it with surrounding context.
3. **Tags/topics** — `#tag` and `#tag/subtag` syntax. Tags panel to browse and filter. Also extracted from YAML frontmatter `tags:` field.

### P1 — Enhanced Editing

4. **Rich markdown** — Task lists (`- [ ]`), callouts/admonitions, syntax-highlighted code blocks, strikethrough, tables.
5. **Full-text search** — Search across all note contents. Results show file name + matching line with highlighted term.
6. **Quick switcher** — `Ctrl+K` / `Cmd+K` modal with fuzzy filename search. Recent files shown by default.

### P2 — Visualization

7. **Graph view** — Force-directed graph showing notes as nodes and links as edges. Current note highlighted. Click to navigate. Pan/zoom.

## Architecture

```
synapse/
├── server/
│   ├── index.js                 # HTTP server entry point
│   ├── router.js                # Request routing
│   ├── api/
│   │   ├── files.js             # CRUD for notes (list, read, write, mkdir, move, delete)
│   │   ├── search.js            # Full-text search endpoint
│   │   ├── links.js             # Backlinks + graph endpoints
│   │   └── tags.js              # Tags listing + per-tag lookup
│   ├── indexer/
│   │   ├── index.js             # Orchestrator — builds all indexes on startup, watches for changes
│   │   ├── links.js             # Parses [[links]], builds forward + reverse maps
│   │   ├── tags.js              # Parses #tags + frontmatter tags
│   │   └── fulltext.js          # Inverted word index for search
│   └── utils/
│       ├── paths.js             # Path validation, traversal prevention
│       └── mime.js              # MIME type detection for static serving
├── src/                         # Svelte frontend
│   ├── lib/
│   │   ├── components/
│   │   │   ├── AppShell.svelte          # Layout (sidebar + main)
│   │   │   ├── Sidebar.svelte           # Navigation panel
│   │   │   ├── FileTree.svelte          # Hierarchical file browser
│   │   │   ├── FileTreeNode.svelte      # Single tree item (file or folder)
│   │   │   ├── Editor.svelte            # CodeMirror 6 wrapper
│   │   │   ├── EditorToolbar.svelte     # Mobile formatting toolbar
│   │   │   ├── BacklinksPanel.svelte    # Incoming links display
│   │   │   ├── TagsPanel.svelte         # Tag browser/filter
│   │   │   ├── TagCloud.svelte          # Visual tag display
│   │   │   ├── QuickSwitcher.svelte     # Cmd+K modal
│   │   │   ├── GraphView.svelte         # Force-directed graph
│   │   │   ├── SearchResults.svelte     # Search result list
│   │   │   └── ThemeToggle.svelte       # Dark/light switcher
│   │   ├── stores/
│   │   │   ├── vault.ts         # File tree state, active file, dirty flag
│   │   │   ├── editor.ts        # Editor content, save state
│   │   │   ├── search.ts        # Search query + results
│   │   │   ├── graph.ts         # Graph data (nodes + edges)
│   │   │   ├── tags.ts          # All tags with counts
│   │   │   └── ui.ts            # Theme, sidebar visibility, active panels
│   │   ├── services/
│   │   │   ├── api.ts           # HTTP client wrapping all server endpoints
│   │   │   ├── keybindings.ts   # Keyboard shortcut registry + handler
│   │   │   └── fuzzy.ts        # Fuzzy match algorithm for quick switcher
│   │   ├── editor/
│   │   │   ├── theme.ts         # CodeMirror theme (dark + light)
│   │   │   ├── markdown.ts      # Markdown language support config
│   │   │   ├── wikilink.ts      # [[link]] autocomplete extension
│   │   │   ├── tags.ts          # #tag autocomplete extension
│   │   │   └── keymaps.ts       # Editor-specific keybindings
│   │   └── utils/
│   │       ├── paths.ts         # Client-side path helpers
│   │       └── debounce.ts      # Debounce utility
│   ├── App.svelte               # Root component
│   ├── main.ts                  # Entry point
│   └── app.html                 # HTML shell
├── tests/
│   ├── unit/
│   │   ├── indexer/
│   │   │   ├── links.test.ts
│   │   │   ├── tags.test.ts
│   │   │   └── fulltext.test.ts
│   │   ├── services/
│   │   │   ├── api.test.ts
│   │   │   └── fuzzy.test.ts
│   │   └── utils/
│   │       └── paths.test.ts
│   └── e2e/
│       ├── navigation.spec.ts
│       ├── editor.spec.ts
│       ├── backlinks.spec.ts
│       ├── tags.spec.ts
│       ├── search.spec.ts
│       ├── quick-switcher.spec.ts
│       └── mobile.spec.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
├── vite.config.ts
├── svelte.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── README.md
```

## Server API

All endpoints return JSON. Content-Type: application/json. Errors return `{error: string}` with appropriate HTTP status.

### File Operations

| Method | Endpoint | Body/Query | Response |
|--------|----------|------------|----------|
| GET | `/api/config` | — | `{name: string, version: string}` |
| GET | `/api/health` | — | `{status: "ok"}` |
| GET | `/api/files/list?dir=path` | Directory path | `[{name, path, type: "file"|"dir"}]` |
| GET | `/api/files/read?path=note.md` | File path | `{content: string, modified: number}` |
| PUT | `/api/files/write` | `{path, content}` | `{ok: true}` |
| POST | `/api/files/mkdir` | `{path}` | `{ok: true}` |
| POST | `/api/files/move` | `{from, to}` | `{ok: true}` |
| DELETE | `/api/files/delete` | `{path}` | `{ok: true}` |

### Search & Index

| Method | Endpoint | Body/Query | Response |
|--------|----------|------------|----------|
| GET | `/api/search?q=term` | Search query | `[{path, matches: [{content, lineNumber}]}]` |
| GET | `/api/links/backlinks?path=note.md` | Target path | `[{source, context, lineNumber}]` |
| GET | `/api/links/graph` | — | `{nodes: [{id, title}], edges: [{source, target}]}` |
| GET | `/api/tags` | — | `[{tag, count}]` |
| GET | `/api/tags/files?tag=tagname` | Tag name | `[{path, lineNumber}]` |

### Static Serving

- Serves `dist/` (built Svelte app) for all non-`/api` routes
- SPA fallback: any path not matching a static file returns `index.html`
- Proper MIME types, cache headers for hashed assets

## Indexing System

### Architecture

The indexer runs server-side. On startup, it recursively scans all `.md` files in the vault and builds three in-memory indexes:

1. **Links Index**
   - Forward: `Map<filePath, [{target, alias, lineNumber}]>`
   - Reverse (backlinks): `Map<filePath, [{source, context, lineNumber}]>`
   - Resolution: case-insensitive filename match, supports path prefixes

2. **Tags Index**
   - `Map<tag, [{path, lineNumber}]>`
   - Sources: inline `#tag` syntax + YAML frontmatter `tags: [...]`
   - Nested: `#parent/child` stored as both `parent/child` and under `parent`

3. **Full-Text Index**
   - Inverted: `Map<word, [{path, lineNumber, position}]>`
   - Tokenization: lowercase, split on non-alphanumeric
   - Stop words excluded
   - Search returns ranked results (more matches = higher)

### Incremental Updates

- After each `/api/files/write`: re-index only the changed file
- `fs.watch` (recursive) on vault root: detect external changes, re-index affected files
- Debounce watch events (100ms) to batch rapid changes

## Frontend Components

### AppShell

- Flexbox layout: sidebar (280px fixed on desktop) + main content (flex-1)
- Mobile: sidebar is `position: fixed` overlay with backdrop
- Hamburger button in top-left on mobile to toggle sidebar
- Swipe gesture: right from left edge opens sidebar, left on sidebar closes it

### Sidebar

Sections (top to bottom):
1. App name + vault name header
2. Search input (debounced — filters tree on type, full-text on Enter)
3. Action buttons: New Note, New Folder
4. File tree (scrollable, takes remaining height)
5. Tags section (collapsible, at bottom)

### FileTree

- Recursive component rendering folders and files
- Folders: click to expand/collapse, lazy-load children from API
- Files: click to open in editor, active file highlighted with accent color
- Drag-and-drop: files can be moved between folders
- Context menu (right-click / long-press): Rename, Delete, New Note Here, New Folder Here
- Icons: folder (open/closed states), file with markdown indicator
- Mobile: 44px minimum touch targets, indentation guides

### Editor

- CodeMirror 6 instance with extensions:
  - `@codemirror/lang-markdown` for syntax highlighting
  - Custom wikilink decoration (colored, clickable)
  - Custom tag decoration (colored badge-style)
  - `[[` autocomplete: triggers on `[[`, shows all note names, inserts `[[Name]]`
  - `#` autocomplete: triggers on `#`, shows all tags, inserts `#tag`
  - Custom theme matching Synapse dark/light colors
- Auto-save: 1200ms debounce after last keystroke
- Status indicator: "Saving..." / "Saved" / "Unsaved changes"
- Ctrl+Click on wikilink: navigate to that note
- Mobile: tap on wikilink navigates (no ctrl needed)

### EditorToolbar (mobile)

- Fixed at bottom of editor on mobile (< 768px)
- Buttons: Bold, Italic, Heading, Link ([[]]), Tag (#), List, Checkbox, Undo, Redo
- Scrollable horizontally if overflow

### BacklinksPanel

- Below editor on desktop, slide-up bottom sheet on mobile
- Header: "N backlinks" with collapse toggle
- Each item: source filename (clickable) + context line with the link highlighted
- Empty state: "No other notes link here yet"
- Fetches from `/api/links/backlinks?path=...` when active file changes

### TagsPanel

- In sidebar, collapsible section
- Two views (toggle): cloud (sized by count) or sorted list
- Each tag clickable — shows matching files in a popover or replaces tree temporarily
- Badge with count next to each tag
- Nested tags shown hierarchically (expandable)

### QuickSwitcher

- Modal overlay triggered by Cmd+K / Ctrl+K
- Input field with instant fuzzy filtering
- Results: ranked list of note names, recent files shown when input is empty
- Enter: open selected, Escape: close
- Arrow keys: navigate results
- Mobile: full-screen overlay

### GraphView

- Dedicated panel/view (toggle from toolbar or Cmd+G)
- Canvas-based rendering (HTML Canvas or SVG for smaller graphs)
- d3-force simulation: nodes repel, linked nodes attract
- Current note: larger node, accent color
- Other notes: smaller, muted color
- Edges: thin lines between linked nodes
- Interaction: click node to navigate, scroll to zoom, drag to pan
- Toggle: "Show all" vs "Show connected only" (default: connected within 2 hops)
- Labels: note titles, fade in on zoom

### SearchResults

- Shown in sidebar when search is active (replaces file tree temporarily)
- Each result: filename header + list of matching lines with highlighted search term
- Click result: opens file and scrolls editor to matching line
- "X results in Y files" summary at top
- Clear button to return to file tree

### ThemeToggle

- Sun/moon icon button
- Three states: Light, Dark, System (auto-detect)
- Stored in localStorage, applied via Tailwind `dark:` classes
- Smooth 200ms color transition on switch

## Styling & Design

### Color Palette (Tailwind)

**Dark (default):**
- `--bg`: slate-950 (#020617)
- `--surface`: slate-900 (#0f172a)
- `--surface-hover`: slate-800 (#1e293b)
- `--border`: slate-700 (#334155)
- `--text`: slate-100 (#f1f5f9)
- `--text-muted`: slate-400 (#94a3b8)
- `--accent`: violet-500 (#8b5cf6)
- `--accent-hover`: violet-400 (#a78bfa)

**Light:**
- `--bg`: slate-50 (#f8fafc)
- `--surface`: white (#ffffff)
- `--surface-hover`: slate-100 (#f1f5f9)
- `--border`: slate-200 (#e2e8f0)
- `--text`: slate-900 (#0f172a)
- `--text-muted`: slate-500 (#64748b)
- `--accent`: violet-600 (#7c3aed)
- `--accent-hover`: violet-700 (#6d28d9)

### Typography

- UI font: Inter (with system font stack fallback: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif)
- Editor/monospace: JetBrains Mono (with fallback: Fira Code, Cascadia Code, monospace)
- Base size: 14px (UI), 15px (editor)
- Line height: 1.5 (UI), 1.6 (editor)

### Responsive Breakpoints

- `sm`: 640px
- `md`: 768px (sidebar becomes overlay below this)
- `lg`: 1024px (panels can sit side-by-side)
- `xl`: 1280px

### Animations

- Sidebar slide: `transform translateX`, 200ms ease-out
- Panel expand: `max-height` + `opacity`, 150ms ease
- Theme: `background-color` + `color`, 200ms
- Hover states: 100ms ease
- File tree expand: 150ms height animation

## Mobile UX

- Sidebar: overlay with semi-transparent backdrop, swipe gestures
- Editor: full-width, toolbar at bottom above keyboard
- Backlinks/Tags: bottom sheet (slide up from bottom, 60% max height)
- Quick Switcher: full-screen overlay
- Graph: full-screen with close button
- Touch targets: minimum 44x44px
- No hover-dependent interactions — everything works with tap

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Quick switcher |
| `Cmd/Ctrl + S` | Force save |
| `Cmd/Ctrl + B` | Bold selection |
| `Cmd/Ctrl + I` | Italic selection |
| `Cmd/Ctrl + Shift + F` | Focus search |
| `Cmd/Ctrl + \` | Toggle sidebar |
| `Cmd/Ctrl + .` | Toggle backlinks panel |
| `Cmd/Ctrl + G` | Toggle graph view |
| `Escape` | Close any modal/panel |

## Security

- Path traversal prevention: all file paths resolved and validated against vault root
- No `..` allowed in paths, null bytes rejected
- HTML in markdown rendered safely (no raw HTML passthrough in preview)
- Static assets served with appropriate Content-Type
- No secrets in client bundle
- Auth handled externally (Authelia SSO — not part of this app)

## Build & Deployment

### Development

```bash
npm install
npm run dev        # Vite dev server (port 5174) + Node API server (port 5173)
```

Vite proxies `/api/*` to the Node server during development.

### Production Build

```bash
npm run build      # Vite builds frontend to dist/
npm start          # Node server serves dist/ + API
```

### Docker

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json .
EXPOSE 5173
CMD ["node", "server/index.js", "--vault", "/vault", "--host", "0.0.0.0"]
```

### Docker Compose (Production)

```yaml
services:
  synapse:
    build: .
    container_name: synapse
    volumes:
      - ./vault:/vault
    environment:
      - PORT=5173
    restart: unless-stopped
    networks:
      - caddy

networks:
  caddy:
    external: true
```

## Testing Strategy

### Unit Tests (Vitest)

**Indexer tests:**
- Link parser: extracts `[[links]]`, `[[link|alias]]`, handles edge cases (code blocks, escaped)
- Backlink builder: correct reverse mapping
- Tag parser: inline tags, frontmatter tags, nested tags
- Full-text indexer: tokenization, stop words, ranking

**Service tests:**
- Fuzzy search: ranking, partial matches, exact vs fuzzy
- Path utilities: normalization, validation, relative resolution
- API client: request formatting (mocked fetch)

### E2E Tests (Playwright)

- **Navigation:** Create note with wikilinks, click link, verify navigation
- **Backlinks:** Note A links to Note B, open B, verify A shows in backlinks
- **Tags:** Add tags, verify tag panel shows them, click tag filters notes
- **Search:** Add content, search for term, verify results, click to navigate
- **Quick Switcher:** Cmd+K, type partial name, verify fuzzy match, enter to open
- **Editor:** Type markdown, verify auto-save, verify syntax highlighting present
- **Mobile:** Viewport 375px, hamburger opens sidebar, swipe closes it
- **Theme:** Toggle dark/light, refresh, verify persistence

## Non-Goals

- Real-time collaboration / multiplayer
- Plugin/extension system
- Calendar view or daily notes automation
- Canvas/whiteboard
- PDF or image annotation
- Git version control integration
- End-to-end encryption
- Compatibility with any specific note-taking app's plugin ecosystem
