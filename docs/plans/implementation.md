# Synapse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Synapse — a web-based knowledge management app with wiki-links, backlinks, tags, graph view, full-text search, and a polished Svelte UI.

**Architecture:** Node.js HTTP server (native `http` module) serves a Svelte 5 SPA built with Vite. Server manages a local vault directory of markdown files and maintains in-memory indexes for links, tags, and full-text search. Frontend uses CodeMirror 6 for editing, shadcn-svelte for UI components, and Tailwind for styling.

**Tech Stack:** Node.js 20, Svelte 5, Vite, Tailwind CSS 4, shadcn-svelte, CodeMirror 6, d3-force, Vitest, Playwright

**Repo:** `/home/ubuntu/topics/obsidian/synapse` on branch `main`, remote `origin` = `github.com/aaron777collins/synapse`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `svelte.config.js`
- Create: `tsconfig.json`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `src/app.html`
- Create: `src/main.ts`
- Create: `src/App.svelte`
- Create: `src/app.css`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "synapse",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "description": "Web-based knowledge management with linked notes",
  "scripts": {
    "dev": "vite",
    "dev:server": "node server/index.js --vault ./test-vault --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "@playwright/test": "^1.50.0",
    "@testing-library/svelte": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "svelte": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0",
    "@tailwindcss/vite": "^4.0.0"
  },
  "dependencies": {
    "@codemirror/lang-markdown": "^6.3.0",
    "@codemirror/language-data": "^6.5.0",
    "@codemirror/autocomplete": "^6.18.0",
    "@codemirror/view": "^6.35.0",
    "@codemirror/state": "^6.5.0",
    "@codemirror/commands": "^6.7.0",
    "codemirror": "^6.0.0",
    "d3-force": "^3.0.0",
    "bits-ui": "^1.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:5173",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
```

- [ ] **Step 3: Create svelte.config.js**

```javascript
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  preprocess: vitePreprocess(),
};
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["svelte", "vite/client"],
    "paths": {
      "$lib/*": ["./src/lib/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "src/**/*.svelte", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
export default {
  plugins: {
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create src/app.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Synapse</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="app">%sveltekit.body%</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Note: Since we're using plain Svelte (not SvelteKit), replace `%sveltekit.body%` with nothing — Svelte mounts into `#app` via `main.ts`.

Corrected `src/app.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Synapse</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: Create src/app.css**

```css
@import "tailwindcss";

:root {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;

  --bg: #020617;
  --surface: #0f172a;
  --surface-hover: #1e293b;
  --border: #334155;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --accent: #8b5cf6;
  --accent-hover: #a78bfa;
  --accent-dim: #7c3aed33;
}

:root.light {
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-hover: #f1f5f9;
  --border: #e2e8f0;
  --text: #0f172a;
  --text-muted: #64748b;
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
  --accent-dim: #8b5cf633;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 8: Create src/main.ts**

```typescript
import "./app.css";
import App from "./App.svelte";
import { mount } from "svelte";

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
```

- [ ] **Step 9: Create src/App.svelte**

```svelte
<script lang="ts">
</script>

<main class="h-full flex items-center justify-center" style="background: var(--bg); color: var(--text);">
  <div class="text-center">
    <h1 class="text-4xl font-bold mb-2" style="color: var(--accent);">Synapse</h1>
    <p style="color: var(--text-muted);">Knowledge management — coming soon</p>
  </div>
</main>
```

- [ ] **Step 10: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
test-vault/
playwright-report/
test-results/
```

- [ ] **Step 11: Install dependencies and verify build**

Run: `npm install && npm run build`
Expected: Clean install, Vite builds to `dist/` with no errors.

- [ ] **Step 12: Verify dev server starts**

Run: `npm run dev`
Expected: Vite starts on port 5174, browser shows "Synapse — Knowledge management — coming soon"

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: project scaffolding — Svelte 5, Vite, Tailwind, CodeMirror deps"
git push -u origin main
```

---

## Task 2: Server — Core File API

**Files:**
- Create: `server/index.js`
- Create: `server/router.js`
- Create: `server/api/files.js`
- Create: `server/utils/paths.js`
- Create: `server/utils/mime.js`
- Create: `tests/unit/server/paths.test.ts`

- [ ] **Step 1: Write path utility tests**

Create `tests/unit/server/paths.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { resolveSafe, isInsideVault, normalizePath } from "../../../server/utils/paths.js";

describe("normalizePath", () => {
  it("converts backslashes to forward slashes", () => {
    expect(normalizePath("foo\\bar\\baz.md")).toBe("foo/bar/baz.md");
  });

  it("removes leading slashes", () => {
    expect(normalizePath("/foo/bar.md")).toBe("foo/bar.md");
  });

  it("strips null bytes", () => {
    expect(normalizePath("foo\0bar.md")).toBe("foobar.md");
  });
});

describe("isInsideVault", () => {
  const vault = "/data/vault";

  it("accepts paths inside vault", () => {
    expect(isInsideVault(vault, "notes/hello.md")).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(isInsideVault(vault, "../etc/passwd")).toBe(false);
  });

  it("rejects double-dot in middle", () => {
    expect(isInsideVault(vault, "notes/../../etc/passwd")).toBe(false);
  });

  it("accepts vault root", () => {
    expect(isInsideVault(vault, "")).toBe(true);
    expect(isInsideVault(vault, ".")).toBe(true);
  });
});

describe("resolveSafe", () => {
  const vault = "/data/vault";

  it("resolves a simple path", () => {
    expect(resolveSafe(vault, "notes/hello.md")).toBe("/data/vault/notes/hello.md");
  });

  it("throws on path traversal", () => {
    expect(() => resolveSafe(vault, "../etc/passwd")).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/server/paths.test.ts`
Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Create server/utils/paths.js**

```javascript
import path from "node:path";

export function normalizePath(p) {
  return p.replace(/\\/g, "/").replace(/\0/g, "").replace(/^\/+/, "");
}

export function isInsideVault(vaultRoot, relativePath) {
  const normalized = normalizePath(relativePath);
  const resolved = path.resolve(vaultRoot, normalized);
  return resolved === vaultRoot || resolved.startsWith(vaultRoot + path.sep);
}

export function resolveSafe(vaultRoot, relativePath) {
  const normalized = normalizePath(relativePath);
  const resolved = path.resolve(vaultRoot, normalized);
  if (!resolved.startsWith(vaultRoot + path.sep) && resolved !== vaultRoot) {
    throw Object.assign(new Error("Path outside vault"), { statusCode: 403 });
  }
  return resolved;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/server/paths.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Create server/utils/mime.js**

```javascript
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

export function getMimeType(filePath) {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}
```

- [ ] **Step 6: Create server/api/files.js**

```javascript
import fs from "node:fs/promises";
import path from "node:path";
import { resolveSafe, normalizePath } from "../utils/paths.js";

const IGNORED = new Set([".git", "node_modules", ".trash", ".DS_Store"]);

export async function listDir(vaultRoot, dirPath) {
  const resolved = resolveSafe(vaultRoot, dirPath || "");
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (IGNORED.has(entry.name) || entry.name.startsWith(".")) continue;
    const relativePath = normalizePath(
      path.relative(vaultRoot, path.join(resolved, entry.name))
    );
    results.push({
      name: entry.name,
      path: relativePath,
      type: entry.isDirectory() ? "dir" : "file",
    });
  }

  results.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  return results;
}

export async function readFile(vaultRoot, filePath) {
  const resolved = resolveSafe(vaultRoot, filePath);
  const content = await fs.readFile(resolved, "utf-8");
  const stat = await fs.stat(resolved);
  return { content, modified: stat.mtimeMs };
}

export async function writeFile(vaultRoot, filePath, content) {
  const resolved = resolveSafe(vaultRoot, filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, "utf-8");
}

export async function mkDir(vaultRoot, dirPath) {
  const resolved = resolveSafe(vaultRoot, dirPath);
  await fs.mkdir(resolved, { recursive: true });
}

export async function moveFile(vaultRoot, fromPath, toPath) {
  const resolvedFrom = resolveSafe(vaultRoot, fromPath);
  const resolvedTo = resolveSafe(vaultRoot, toPath);
  await fs.mkdir(path.dirname(resolvedTo), { recursive: true });
  await fs.rename(resolvedFrom, resolvedTo);
}

export async function deleteFile(vaultRoot, filePath) {
  const resolved = resolveSafe(vaultRoot, filePath);
  await fs.unlink(resolved);
}
```

- [ ] **Step 7: Create server/router.js**

```javascript
import { URL } from "node:url";

export function createRouter() {
  const routes = [];

  function addRoute(method, path, handler) {
    routes.push({ method, path, handler });
  }

  async function handle(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    for (const route of routes) {
      if (req.method !== route.method) continue;

      if (typeof route.path === "string" && route.path === pathname) {
        return route.handler(req, res, url);
      }

      if (route.path instanceof RegExp) {
        const match = pathname.match(route.path);
        if (match) {
          req.params = match.groups || {};
          return route.handler(req, res, url);
        }
      }
    }

    return null;
  }

  return { get: (p, h) => addRoute("GET", p, h), put: (p, h) => addRoute("PUT", p, h), post: (p, h) => addRoute("POST", p, h), delete: (p, h) => addRoute("DELETE", p, h), handle };
}

export function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

export async function readBody(req, maxBytes = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("Payload too large"), { statusCode: 413 }));
        req.destroy();
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
    req.on("error", reject);
  });
}
```

- [ ] **Step 8: Create server/index.js**

```javascript
import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRouter, json, readBody } from "./router.js";
import { listDir, readFile, writeFile, mkDir, moveFile, deleteFile } from "./api/files.js";
import { getMimeType } from "./utils/mime.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const VAULT = path.resolve(getArg("vault") || process.env.SYNAPSE_VAULT || "./vault");
const PORT = parseInt(getArg("port") || process.env.PORT || "5173", 10);
const HOST = getArg("host") || process.env.HOST || "127.0.0.1";

if (!fs.existsSync(VAULT)) {
  fs.mkdirSync(VAULT, { recursive: true });
  console.log(`Created vault directory: ${VAULT}`);
}

const router = createRouter();

router.get("/api/config", (_req, res) => {
  json(res, { name: path.basename(VAULT), version: "0.1.0" });
});

router.get("/api/health", (_req, res) => {
  json(res, { status: "ok" });
});

router.get("/api/files/list", async (req, res, url) => {
  const dir = url.searchParams.get("dir") || "";
  const entries = await listDir(VAULT, dir);
  json(res, entries);
});

router.get("/api/files/read", async (req, res, url) => {
  const filePath = url.searchParams.get("path");
  if (!filePath) return json(res, { error: "path required" }, 400);
  const result = await readFile(VAULT, filePath);
  json(res, result);
});

router.put("/api/files/write", async (req, res) => {
  const body = await readBody(req, 10 * 1024 * 1024);
  if (!body.path || body.content === undefined) return json(res, { error: "path and content required" }, 400);
  await writeFile(VAULT, body.path, body.content);
  json(res, { ok: true });
});

router.post("/api/files/mkdir", async (req, res) => {
  const body = await readBody(req);
  if (!body.path) return json(res, { error: "path required" }, 400);
  await mkDir(VAULT, body.path);
  json(res, { ok: true });
});

router.post("/api/files/move", async (req, res) => {
  const body = await readBody(req);
  if (!body.from || !body.to) return json(res, { error: "from and to required" }, 400);
  await moveFile(VAULT, body.from, body.to);
  json(res, { ok: true });
});

router.delete("/api/files/delete", async (req, res) => {
  const body = await readBody(req);
  if (!body.path) return json(res, { error: "path required" }, 400);
  await deleteFile(VAULT, body.path);
  json(res, { ok: true });
});

const DIST = path.join(ROOT, "dist");
const hasDist = fs.existsSync(DIST);
const staticRoot = hasDist ? DIST : path.join(ROOT, "public");
let indexHtml = null;

if (hasDist) {
  try {
    indexHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");
  } catch {}
}

const server = http.createServer(async (req, res) => {
  try {
    const result = await router.handle(req, res);
    if (result !== null) return;

    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const filePath = path.join(staticRoot, url.pathname === "/" ? "index.html" : url.pathname);
      const safeCheck = path.resolve(filePath);
      if (!safeCheck.startsWith(staticRoot)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      try {
        await fsp.access(filePath);
        const stat = await fsp.stat(filePath);
        if (stat.isFile()) {
          res.writeHead(200, {
            "Content-Type": getMimeType(filePath),
            "Content-Length": stat.size,
          });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      } catch {}

      if (indexHtml) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(indexHtml);
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    }
  } catch (err) {
    const status = err.statusCode || 500;
    json(res, { error: err.message }, status);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Synapse server: http://${HOST}:${PORT}`);
  console.log(`Vault: ${VAULT}`);
  if (hasDist) console.log(`Serving frontend from: ${DIST}`);
});

export { VAULT };
```

- [ ] **Step 9: Create a test vault and verify server starts**

```bash
mkdir -p test-vault/notes
echo "# Welcome\n\nThis is your first note." > test-vault/Welcome.md
echo "# Second Note\n\nLinks to [[Welcome]].\n\n#getting-started" > test-vault/notes/Second.md
node server/index.js --vault ./test-vault
```

Expected: `Synapse server: http://127.0.0.1:5173` + `Vault: .../test-vault`

Test with curl:
```bash
curl http://localhost:5173/api/health
curl http://localhost:5173/api/files/list
curl "http://localhost:5173/api/files/read?path=Welcome.md"
```

- [ ] **Step 10: Run path tests to verify they pass**

Run: `npx vitest run tests/unit/server/paths.test.ts`
Expected: All PASS.

- [ ] **Step 11: Commit**

```bash
git add server/ tests/unit/server/
git commit -m "feat: server core — file API with path safety, routing, static serving"
```

---

## Task 3: Server — Indexing System (Links, Tags, Full-Text)

**Files:**
- Create: `server/indexer/index.js`
- Create: `server/indexer/links.js`
- Create: `server/indexer/tags.js`
- Create: `server/indexer/fulltext.js`
- Create: `server/api/search.js`
- Create: `server/api/links.js`
- Create: `server/api/tags.js`
- Create: `tests/unit/server/links.test.ts`
- Create: `tests/unit/server/tags.test.ts`
- Create: `tests/unit/server/fulltext.test.ts`
- Modify: `server/index.js` (add new routes + init indexer)

- [ ] **Step 1: Write link parser tests**

Create `tests/unit/server/links.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseLinks, buildBacklinks } from "../../../server/indexer/links.js";

describe("parseLinks", () => {
  it("extracts basic wikilinks", () => {
    const links = parseLinks("Check out [[My Note]] for more.");
    expect(links).toEqual([{ target: "My Note", alias: null, lineNumber: 1 }]);
  });

  it("extracts aliased wikilinks", () => {
    const links = parseLinks("See [[My Note|this note]] here.");
    expect(links).toEqual([{ target: "My Note", alias: "this note", lineNumber: 1 }]);
  });

  it("extracts multiple links on different lines", () => {
    const links = parseLinks("Link to [[A]]\nAnd [[B]] and [[C|see C]]");
    expect(links).toHaveLength(3);
    expect(links[0]).toEqual({ target: "A", alias: null, lineNumber: 1 });
    expect(links[1]).toEqual({ target: "B", alias: null, lineNumber: 2 });
    expect(links[2]).toEqual({ target: "C", alias: "see C", lineNumber: 2 });
  });

  it("ignores links inside code blocks", () => {
    const links = parseLinks("```\n[[not a link]]\n```\n[[real link]]");
    expect(links).toEqual([{ target: "real link", alias: null, lineNumber: 4 }]);
  });

  it("ignores links inside inline code", () => {
    const links = parseLinks("This `[[not a link]]` is code. But [[real]] is not.");
    expect(links).toEqual([{ target: "real", alias: null, lineNumber: 1 }]);
  });

  it("handles section anchors", () => {
    const links = parseLinks("See [[Note#Section]]");
    expect(links).toEqual([{ target: "Note", alias: null, lineNumber: 1 }]);
  });
});

describe("buildBacklinks", () => {
  it("builds reverse link map", () => {
    const forwardLinks = new Map([
      ["a.md", [{ target: "B", alias: null, lineNumber: 1 }]],
      ["c.md", [{ target: "B", alias: null, lineNumber: 3 }, { target: "A", alias: null, lineNumber: 5 }]],
    ]);
    const fileIndex = new Map([["a", ["a.md"]], ["b", ["b.md"]], ["c", ["c.md"]]]);
    const backlinks = buildBacklinks(forwardLinks, fileIndex);
    expect(backlinks.get("b.md")).toHaveLength(2);
    expect(backlinks.get("a.md")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/unit/server/links.test.ts`
Expected: FAIL.

- [ ] **Step 3: Create server/indexer/links.js**

```javascript
export function parseLinks(content) {
  const lines = content.split("\n");
  const links = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const withoutInlineCode = line.replace(/`[^`]+`/g, "");
    const regex = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = regex.exec(withoutInlineCode)) !== null) {
      let target = match[1];
      let alias = null;

      if (target.includes("|")) {
        const parts = target.split("|");
        target = parts[0];
        alias = parts[1];
      }

      if (target.includes("#")) {
        target = target.split("#")[0];
      }

      target = target.trim();
      if (target) {
        links.push({ target, alias, lineNumber: i + 1 });
      }
    }
  }

  return links;
}

export function buildBacklinks(forwardLinks, fileIndex) {
  const backlinks = new Map();

  for (const [sourcePath, links] of forwardLinks) {
    for (const link of links) {
      const targetKey = link.target.toLowerCase();
      const targetFiles = fileIndex.get(targetKey) || [];

      for (const targetPath of targetFiles) {
        if (!backlinks.has(targetPath)) backlinks.set(targetPath, []);
        backlinks.get(targetPath).push({
          source: sourcePath,
          lineNumber: link.lineNumber,
        });
      }
    }
  }

  return backlinks;
}

export function resolveLink(target, fileIndex) {
  const key = target.replace(/\.md$/i, "").toLowerCase();
  const matches = fileIndex.get(key);
  return matches ? matches[0] : null;
}
```

- [ ] **Step 4: Run link tests**

Run: `npx vitest run tests/unit/server/links.test.ts`
Expected: All PASS.

- [ ] **Step 5: Write tag parser tests**

Create `tests/unit/server/tags.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseTags } from "../../../server/indexer/tags.js";

describe("parseTags", () => {
  it("extracts inline tags", () => {
    const tags = parseTags("Some text #hello and #world here.");
    expect(tags).toEqual([
      { tag: "hello", lineNumber: 1 },
      { tag: "world", lineNumber: 1 },
    ]);
  });

  it("extracts nested tags", () => {
    const tags = parseTags("Topic #project/backend for work.");
    expect(tags).toEqual([{ tag: "project/backend", lineNumber: 1 }]);
  });

  it("ignores tags in code blocks", () => {
    const tags = parseTags("```\n#not-a-tag\n```\n#real-tag");
    expect(tags).toEqual([{ tag: "real-tag", lineNumber: 4 }]);
  });

  it("ignores tags in inline code", () => {
    const tags = parseTags("Use `#not-a-tag` but #real-tag");
    expect(tags).toEqual([{ tag: "real-tag", lineNumber: 1 }]);
  });

  it("ignores headings", () => {
    const tags = parseTags("# Heading\n## Another\n#actual-tag");
    expect(tags).toEqual([{ tag: "actual-tag", lineNumber: 3 }]);
  });

  it("extracts frontmatter tags", () => {
    const tags = parseTags("---\ntags: [hello, world]\n---\nContent here.");
    expect(tags).toEqual([
      { tag: "hello", lineNumber: 2 },
      { tag: "world", lineNumber: 2 },
    ]);
  });

  it("extracts frontmatter tags in list format", () => {
    const tags = parseTags("---\ntags:\n  - alpha\n  - beta\n---\nContent.");
    expect(tags).toEqual([
      { tag: "alpha", lineNumber: 3 },
      { tag: "beta", lineNumber: 4 },
    ]);
  });
});
```

- [ ] **Step 6: Run to verify fail**

Run: `npx vitest run tests/unit/server/tags.test.ts`
Expected: FAIL.

- [ ] **Step 7: Create server/indexer/tags.js**

```javascript
export function parseTags(content) {
  const tags = [];
  const lines = content.split("\n");
  let inCodeBlock = false;
  let inFrontmatter = false;
  let frontmatterDone = false;
  let inFrontmatterTags = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (i === 0 && trimmed === "---") {
      inFrontmatter = true;
      continue;
    }

    if (inFrontmatter && trimmed === "---") {
      inFrontmatter = false;
      frontmatterDone = true;
      inFrontmatterTags = false;
      continue;
    }

    if (inFrontmatter) {
      if (trimmed.startsWith("tags:")) {
        const inline = trimmed.slice(5).trim();
        if (inline.startsWith("[")) {
          const items = inline.replace(/[\[\]]/g, "").split(",").map(s => s.trim()).filter(Boolean);
          for (const item of items) {
            tags.push({ tag: item, lineNumber: i + 1 });
          }
        } else if (!inline) {
          inFrontmatterTags = true;
        }
        continue;
      }

      if (inFrontmatterTags) {
        if (trimmed.startsWith("- ")) {
          tags.push({ tag: trimmed.slice(2).trim(), lineNumber: i + 1 });
        } else {
          inFrontmatterTags = false;
        }
        continue;
      }

      continue;
    }

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const withoutInlineCode = line.replace(/`[^`]+`/g, "");

    if (/^#{1,6}\s/.test(withoutInlineCode.trimStart())) continue;

    const regex = /(?:^|[\s(])#([a-zA-Z][\w/-]*)/g;
    let match;
    while ((match = regex.exec(withoutInlineCode)) !== null) {
      tags.push({ tag: match[1], lineNumber: i + 1 });
    }
  }

  return tags;
}
```

- [ ] **Step 8: Run tag tests**

Run: `npx vitest run tests/unit/server/tags.test.ts`
Expected: All PASS.

- [ ] **Step 9: Write full-text index tests**

Create `tests/unit/server/fulltext.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { tokenize, buildFullTextIndex, searchIndex } from "../../../server/indexer/fulltext.js";

describe("tokenize", () => {
  it("lowercases and splits on non-alpha", () => {
    expect(tokenize("Hello World")).toEqual(["hello", "world"]);
  });

  it("filters stop words", () => {
    const tokens = tokenize("the quick brown fox and the lazy dog");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("and");
    expect(tokens).toContain("quick");
  });

  it("filters short tokens", () => {
    const tokens = tokenize("I am a big person");
    expect(tokens).not.toContain("i");
    expect(tokens).not.toContain("am");
    expect(tokens).not.toContain("a");
    expect(tokens).toContain("big");
    expect(tokens).toContain("person");
  });
});

describe("searchIndex", () => {
  it("returns matching files ranked by hits", () => {
    const files = new Map([
      ["a.md", "hello world hello again"],
      ["b.md", "hello there"],
      ["c.md", "goodbye world"],
    ]);
    const index = buildFullTextIndex(files);
    const results = searchIndex(index, "hello", files);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].path).toBe("a.md");
  });

  it("returns empty for no match", () => {
    const files = new Map([["a.md", "hello world"]]);
    const index = buildFullTextIndex(files);
    const results = searchIndex(index, "zzzznotfound", files);
    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 10: Run to verify fail**

Run: `npx vitest run tests/unit/server/fulltext.test.ts`
Expected: FAIL.

- [ ] **Step 11: Create server/indexer/fulltext.js**

```javascript
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "as", "be", "was", "are",
  "been", "has", "had", "have", "do", "did", "does", "will", "would",
  "could", "should", "may", "might", "this", "that", "these", "those",
  "not", "no", "nor", "so", "if", "then", "than", "when", "while",
  "where", "what", "which", "who", "whom", "how", "all", "each",
  "every", "both", "few", "more", "most", "other", "some", "such",
  "only", "own", "same", "too", "very", "can", "just", "into",
]);

export function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function buildFullTextIndex(files) {
  const index = new Map();

  for (const [filePath, content] of files) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const tokens = tokenize(lines[i]);
      for (const token of tokens) {
        if (!index.has(token)) index.set(token, []);
        index.get(token).push({ path: filePath, lineNumber: i + 1 });
      }
    }
  }

  return index;
}

export function searchIndex(index, query, files) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scores = new Map();

  for (const token of queryTokens) {
    const entries = index.get(token) || [];
    for (const entry of entries) {
      const current = scores.get(entry.path) || { count: 0, lines: new Set() };
      current.count++;
      current.lines.add(entry.lineNumber);
      scores.set(entry.path, current);
    }
  }

  const results = [];
  for (const [filePath, score] of scores) {
    const content = files.get(filePath) || "";
    const allLines = content.split("\n");
    const matches = [];
    for (const lineNum of score.lines) {
      matches.push({
        content: allLines[lineNum - 1] || "",
        lineNumber: lineNum,
      });
    }
    matches.sort((a, b) => a.lineNumber - b.lineNumber);
    results.push({ path: filePath, matches, score: score.count });
  }

  results.sort((a, b) => b.score - a.score);
  return results.map(({ path, matches }) => ({ path, matches }));
}
```

- [ ] **Step 12: Run full-text tests**

Run: `npx vitest run tests/unit/server/fulltext.test.ts`
Expected: All PASS.

- [ ] **Step 13: Create server/indexer/index.js (orchestrator)**

```javascript
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { parseLinks, buildBacklinks } from "./links.js";
import { parseTags } from "./tags.js";
import { buildFullTextIndex, searchIndex } from "./fulltext.js";

const IGNORED = new Set([".git", "node_modules", ".trash", ".DS_Store"]);

export function createIndexer(vaultRoot) {
  let forwardLinks = new Map();
  let backlinkIndex = new Map();
  let tagIndex = new Map();
  let fullTextIdx = new Map();
  let fileContents = new Map();
  let fileIndex = new Map();

  async function scanAllFiles(dir = "") {
    const fullDir = path.join(vaultRoot, dir);
    const entries = await fsp.readdir(fullDir, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORED.has(entry.name) || entry.name.startsWith(".")) continue;
      const relative = dir ? `${dir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await scanAllFiles(relative);
      } else if (entry.name.endsWith(".md")) {
        const content = await fsp.readFile(path.join(vaultRoot, relative), "utf-8");
        fileContents.set(relative, content);

        const baseName = entry.name.replace(/\.md$/i, "").toLowerCase();
        if (!fileIndex.has(baseName)) fileIndex.set(baseName, []);
        fileIndex.get(baseName).push(relative);
      }
    }
  }

  async function buildAll() {
    fileContents.clear();
    fileIndex.clear();
    forwardLinks.clear();
    tagIndex.clear();

    await scanAllFiles();

    for (const [filePath, content] of fileContents) {
      forwardLinks.set(filePath, parseLinks(content));

      const tags = parseTags(content);
      for (const { tag, lineNumber } of tags) {
        if (!tagIndex.has(tag)) tagIndex.set(tag, []);
        tagIndex.get(tag).push({ path: filePath, lineNumber });
      }
    }

    backlinkIndex = buildBacklinks(forwardLinks, fileIndex);
    fullTextIdx = buildFullTextIndex(fileContents);

    console.log(`Indexed ${fileContents.size} files, ${forwardLinks.size} link maps, ${tagIndex.size} tags`);
  }

  function reindexFile(relativePath, content) {
    fileContents.set(relativePath, content);

    const baseName = path.basename(relativePath, ".md").toLowerCase();
    if (!fileIndex.has(baseName)) fileIndex.set(baseName, []);
    const paths = fileIndex.get(baseName);
    if (!paths.includes(relativePath)) paths.push(relativePath);

    forwardLinks.set(relativePath, parseLinks(content));

    for (const [tag, entries] of tagIndex) {
      tagIndex.set(tag, entries.filter((e) => e.path !== relativePath));
      if (tagIndex.get(tag).length === 0) tagIndex.delete(tag);
    }
    const tags = parseTags(content);
    for (const { tag, lineNumber } of tags) {
      if (!tagIndex.has(tag)) tagIndex.set(tag, []);
      tagIndex.get(tag).push({ path: relativePath, lineNumber });
    }

    backlinkIndex = buildBacklinks(forwardLinks, fileIndex);
    fullTextIdx = buildFullTextIndex(fileContents);
  }

  function removeFile(relativePath) {
    fileContents.delete(relativePath);
    forwardLinks.delete(relativePath);

    const baseName = path.basename(relativePath, ".md").toLowerCase();
    if (fileIndex.has(baseName)) {
      const paths = fileIndex.get(baseName).filter((p) => p !== relativePath);
      if (paths.length === 0) fileIndex.delete(baseName);
      else fileIndex.set(baseName, paths);
    }

    for (const [tag, entries] of tagIndex) {
      tagIndex.set(tag, entries.filter((e) => e.path !== relativePath));
      if (tagIndex.get(tag).length === 0) tagIndex.delete(tag);
    }

    backlinkIndex = buildBacklinks(forwardLinks, fileIndex);
    fullTextIdx = buildFullTextIndex(fileContents);
  }

  function getBacklinks(filePath) {
    return backlinkIndex.get(filePath) || [];
  }

  function getGraph() {
    const nodes = [];
    for (const [filePath] of fileContents) {
      const title = path.basename(filePath, ".md");
      nodes.push({ id: filePath, title });
    }

    const edges = [];
    for (const [source, links] of forwardLinks) {
      for (const link of links) {
        const targetKey = link.target.toLowerCase();
        const targetFiles = fileIndex.get(targetKey) || [];
        for (const target of targetFiles) {
          edges.push({ source, target });
        }
      }
    }

    return { nodes, edges };
  }

  function getTags() {
    const result = [];
    for (const [tag, entries] of tagIndex) {
      result.push({ tag, count: entries.length });
    }
    result.sort((a, b) => b.count - a.count);
    return result;
  }

  function getTagFiles(tag) {
    return tagIndex.get(tag) || [];
  }

  function search(query) {
    return searchIndex(fullTextIdx, query, fileContents);
  }

  function getFileIndex() {
    return fileIndex;
  }

  function getBacklinkContext(filePath) {
    const links = getBacklinks(filePath);
    return links.map((link) => {
      const content = fileContents.get(link.source) || "";
      const lines = content.split("\n");
      const context = lines[link.lineNumber - 1] || "";
      return { source: link.source, context, lineNumber: link.lineNumber };
    });
  }

  function startWatcher() {
    let debounceTimer = null;
    const pending = new Set();

    try {
      fs.watch(vaultRoot, { recursive: true }, (event, filename) => {
        if (!filename || !filename.endsWith(".md")) return;
        const normalized = filename.replace(/\\/g, "/");
        pending.add(normalized);

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          for (const file of pending) {
            const fullPath = path.join(vaultRoot, file);
            try {
              const content = await fsp.readFile(fullPath, "utf-8");
              reindexFile(file, content);
            } catch {
              removeFile(file);
            }
          }
          pending.clear();
        }, 100);
      });
      console.log("File watcher started");
    } catch (err) {
      console.warn("File watching not available:", err.message);
    }
  }

  return {
    buildAll,
    reindexFile,
    removeFile,
    getBacklinks,
    getBacklinkContext,
    getGraph,
    getTags,
    getTagFiles,
    search,
    getFileIndex,
    startWatcher,
  };
}
```

- [ ] **Step 14: Create server/api/search.js**

```javascript
export function registerSearchRoutes(router, indexer) {
  router.get("/api/search", (req, res, url) => {
    const query = url.searchParams.get("q");
    if (!query) {
      const { json } = await import("../router.js");
      json(res, { error: "q required" }, 400);
      return;
    }
    const { json } = await import("../router.js");
    const results = indexer.search(query);
    json(res, results);
  });
}
```

Wait — using dynamic import is awkward. Let me restructure. The route registration functions should receive `json` as well.

Revised approach: pass `json` into route registrators, or just import it statically. Since `router.js` is pure ESM, static import works:

```javascript
import { json } from "../router.js";

export function registerSearchRoutes(router, indexer) {
  router.get("/api/search", (_req, res, url) => {
    const query = url.searchParams.get("q");
    if (!query) return json(res, { error: "q required" }, 400);
    const results = indexer.search(query);
    json(res, results);
  });
}
```

- [ ] **Step 15: Create server/api/links.js**

```javascript
import { json } from "../router.js";

export function registerLinkRoutes(router, indexer) {
  router.get("/api/links/backlinks", (_req, res, url) => {
    const filePath = url.searchParams.get("path");
    if (!filePath) return json(res, { error: "path required" }, 400);
    const backlinks = indexer.getBacklinkContext(filePath);
    json(res, backlinks);
  });

  router.get("/api/links/graph", (_req, res) => {
    const graph = indexer.getGraph();
    json(res, graph);
  });
}
```

- [ ] **Step 16: Create server/api/tags.js**

```javascript
import { json } from "../router.js";

export function registerTagRoutes(router, indexer) {
  router.get("/api/tags", (_req, res) => {
    const tags = indexer.getTags();
    json(res, tags);
  });

  router.get("/api/tags/files", (_req, res, url) => {
    const tag = url.searchParams.get("tag");
    if (!tag) return json(res, { error: "tag required" }, 400);
    const files = indexer.getTagFiles(tag);
    json(res, files);
  });
}
```

- [ ] **Step 17: Update server/index.js to init indexer + register new routes**

Add these imports at the top:

```javascript
import { createIndexer } from "./indexer/index.js";
import { registerSearchRoutes } from "./api/search.js";
import { registerLinkRoutes } from "./api/links.js";
import { registerTagRoutes } from "./api/tags.js";
```

After the existing file routes, add:

```javascript
const indexer = createIndexer(VAULT);
registerSearchRoutes(router, indexer);
registerLinkRoutes(router, indexer);
registerTagRoutes(router, indexer);
```

Modify the `/api/files/write` handler to also reindex:

```javascript
router.put("/api/files/write", async (req, res) => {
  const body = await readBody(req, 10 * 1024 * 1024);
  if (!body.path || body.content === undefined) return json(res, { error: "path and content required" }, 400);
  await writeFile(VAULT, body.path, body.content);
  if (body.path.endsWith(".md")) {
    indexer.reindexFile(body.path, body.content);
  }
  json(res, { ok: true });
});
```

Similarly for delete:

```javascript
router.delete("/api/files/delete", async (req, res) => {
  const body = await readBody(req);
  if (!body.path) return json(res, { error: "path required" }, 400);
  await deleteFile(VAULT, body.path);
  if (body.path.endsWith(".md")) {
    indexer.removeFile(body.path);
  }
  json(res, { ok: true });
});
```

Before `server.listen`, add indexer initialization:

```javascript
await indexer.buildAll();
indexer.startWatcher();
```

Wrap the entire server startup in an async IIFE since we need top-level await for the indexer:

```javascript
(async () => {
  await indexer.buildAll();
  indexer.startWatcher();

  server.listen(PORT, HOST, () => {
    console.log(`Synapse server: http://${HOST}:${PORT}`);
    console.log(`Vault: ${VAULT}`);
    if (hasDist) console.log(`Serving frontend from: ${DIST}`);
  });
})();
```

- [ ] **Step 18: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS (paths, links, tags, fulltext).

- [ ] **Step 19: Manual test with curl**

```bash
node server/index.js --vault ./test-vault &
curl "http://localhost:5173/api/links/backlinks?path=Welcome.md"
curl "http://localhost:5173/api/tags"
curl "http://localhost:5173/api/search?q=welcome"
curl "http://localhost:5173/api/links/graph"
kill %1
```

- [ ] **Step 20: Commit**

```bash
git add server/indexer/ server/api/ tests/unit/server/
git commit -m "feat: server indexing — links, backlinks, tags, full-text search with incremental updates"
```

---

## Task 4: Frontend — Stores, API Client, Utilities

**Files:**
- Create: `src/lib/stores/vault.ts`
- Create: `src/lib/stores/editor.ts`
- Create: `src/lib/stores/search.ts`
- Create: `src/lib/stores/tags.ts`
- Create: `src/lib/stores/graph.ts`
- Create: `src/lib/stores/ui.ts`
- Create: `src/lib/services/api.ts`
- Create: `src/lib/services/fuzzy.ts`
- Create: `src/lib/utils/paths.ts`
- Create: `src/lib/utils/debounce.ts`
- Create: `tests/unit/services/fuzzy.test.ts`
- Create: `tests/unit/utils/paths.test.ts`

- [ ] **Step 1: Write fuzzy search tests**

Create `tests/unit/services/fuzzy.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { fuzzyMatch, fuzzySort } from "../../../src/lib/services/fuzzy";

describe("fuzzyMatch", () => {
  it("matches exact", () => {
    expect(fuzzyMatch("hello", "hello")).toBeTruthy();
  });

  it("matches substring", () => {
    expect(fuzzyMatch("hel", "hello world")).toBeTruthy();
  });

  it("matches non-contiguous characters", () => {
    expect(fuzzyMatch("hlo", "hello")).toBeTruthy();
  });

  it("is case insensitive", () => {
    expect(fuzzyMatch("HEL", "hello")).toBeTruthy();
  });

  it("rejects non-matching", () => {
    expect(fuzzyMatch("xyz", "hello")).toBeFalsy();
  });
});

describe("fuzzySort", () => {
  it("ranks exact match highest", () => {
    const items = ["apple", "application", "app"];
    const results = fuzzySort("app", items);
    expect(results[0]).toBe("app");
  });

  it("ranks prefix match before scattered", () => {
    const items = ["setup", "step", "stops"];
    const results = fuzzySort("ste", items);
    expect(results[0]).toBe("step");
  });
});
```

- [ ] **Step 2: Write client-side path util tests**

Create `tests/unit/utils/paths.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { basename, dirname, extension, stripExtension } from "../../../src/lib/utils/paths";

describe("paths", () => {
  it("gets basename", () => {
    expect(basename("notes/hello.md")).toBe("hello.md");
  });

  it("gets dirname", () => {
    expect(dirname("notes/hello.md")).toBe("notes");
  });

  it("gets extension", () => {
    expect(extension("hello.md")).toBe("md");
  });

  it("strips extension", () => {
    expect(stripExtension("hello.md")).toBe("hello");
  });

  it("handles root files", () => {
    expect(dirname("hello.md")).toBe("");
    expect(basename("hello.md")).toBe("hello.md");
  });
});
```

- [ ] **Step 3: Run to verify fail**

Run: `npx vitest run tests/unit/services tests/unit/utils`
Expected: FAIL.

- [ ] **Step 4: Create src/lib/services/fuzzy.ts**

```typescript
export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (t === q) return 1000;
  if (t.startsWith(q)) return 500 + (q.length / t.length) * 100;

  let score = 0;
  let qi = 0;
  let consecutive = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutive++;
      score += consecutive * 10;
      if (ti === 0 || t[ti - 1] === "/" || t[ti - 1] === " " || t[ti - 1] === "-") {
        score += 20;
      }
    } else {
      consecutive = 0;
    }
  }

  return qi === q.length ? score : 0;
}

export function fuzzySort(query: string, items: string[]): string[] {
  return items
    .map((item) => ({ item, score: fuzzyScore(query, item) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}
```

- [ ] **Step 5: Create src/lib/utils/paths.ts**

```typescript
export function basename(p: string): string {
  const idx = p.lastIndexOf("/");
  return idx === -1 ? p : p.substring(idx + 1);
}

export function dirname(p: string): string {
  const idx = p.lastIndexOf("/");
  return idx === -1 ? "" : p.substring(0, idx);
}

export function extension(p: string): string {
  const name = basename(p);
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.substring(idx + 1);
}

export function stripExtension(p: string): string {
  const idx = p.lastIndexOf(".");
  return idx === -1 ? p : p.substring(0, idx);
}
```

- [ ] **Step 6: Create src/lib/utils/debounce.ts**

```typescript
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```

- [ ] **Step 7: Create src/lib/services/api.ts**

```typescript
const BASE = "";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "dir";
}

export interface FileContent {
  content: string;
  modified: number;
}

export interface SearchResult {
  path: string;
  matches: { content: string; lineNumber: number }[];
}

export interface BacklinkEntry {
  source: string;
  context: string;
  lineNumber: number;
}

export interface GraphData {
  nodes: { id: string; title: string }[];
  edges: { source: string; target: string }[];
}

export interface TagEntry {
  tag: string;
  count: number;
}

export interface TagFile {
  path: string;
  lineNumber: number;
}

export const api = {
  config: () => request<{ name: string; version: string }>("/api/config"),
  health: () => request<{ status: string }>("/api/health"),

  files: {
    list: (dir = "") => request<FileEntry[]>(`/api/files/list?dir=${encodeURIComponent(dir)}`),
    read: (path: string) => request<FileContent>(`/api/files/read?path=${encodeURIComponent(path)}`),
    write: (path: string, content: string) =>
      request<{ ok: boolean }>("/api/files/write", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      }),
    mkdir: (path: string) =>
      request<{ ok: boolean }>("/api/files/mkdir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      }),
    move: (from: string, to: string) =>
      request<{ ok: boolean }>("/api/files/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      }),
    delete: (path: string) =>
      request<{ ok: boolean }>("/api/files/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      }),
  },

  search: (q: string) => request<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`),

  links: {
    backlinks: (path: string) =>
      request<BacklinkEntry[]>(`/api/links/backlinks?path=${encodeURIComponent(path)}`),
    graph: () => request<GraphData>("/api/links/graph"),
  },

  tags: {
    list: () => request<TagEntry[]>("/api/tags"),
    files: (tag: string) => request<TagFile[]>(`/api/tags/files?tag=${encodeURIComponent(tag)}`),
  },
};
```

- [ ] **Step 8: Create src/lib/stores/ui.ts**

```typescript
import { writable } from "svelte/store";

function createThemeStore() {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem("synapse-theme") : null;
  const initial = stored || "dark";

  const { subscribe, set, update } = writable(initial);

  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("light", initial === "light");
  }

  return {
    subscribe,
    toggle() {
      update((current) => {
        const next = current === "dark" ? "light" : "dark";
        localStorage.setItem("synapse-theme", next);
        document.documentElement.classList.toggle("light", next === "light");
        return next;
      });
    },
  };
}

export const theme = createThemeStore();
export const sidebarOpen = writable(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
export const backlinksOpen = writable(true);
export const graphOpen = writable(false);
```

- [ ] **Step 9: Create src/lib/stores/vault.ts**

```typescript
import { writable, derived, get } from "svelte/store";
import { api, type FileEntry } from "$lib/services/api";

export const activeFile = writable<string | null>(null);
export const activeContent = writable<string>("");
export const dirty = writable(false);
export const saveStatus = writable<"saved" | "saving" | "unsaved" | "error">("saved");
export const expandedDirs = writable<Set<string>>(new Set());
export const childrenByDir = writable<Map<string, FileEntry[]>>(new Map());
export const allFiles = writable<string[]>([]);
export const recentFiles = writable<string[]>([]);

export async function loadDir(dir: string) {
  const entries = await api.files.list(dir);
  childrenByDir.update((m) => {
    m.set(dir, entries);
    return new Map(m);
  });

  const files: string[] = [];
  for (const entry of entries) {
    if (entry.type === "file") files.push(entry.path);
  }
  allFiles.update((existing) => {
    const set = new Set(existing);
    for (const f of files) set.add(f);
    return [...set];
  });

  return entries;
}

export async function openFile(path: string) {
  const { content } = await api.files.read(path);
  activeFile.set(path);
  activeContent.set(content);
  dirty.set(false);
  saveStatus.set("saved");

  recentFiles.update((recent) => {
    const filtered = recent.filter((f) => f !== path);
    return [path, ...filtered].slice(0, 20);
  });
}

export async function saveFile() {
  const path = get(activeFile);
  const content = get(activeContent);
  if (!path) return;

  saveStatus.set("saving");
  try {
    await api.files.write(path, content);
    dirty.set(false);
    saveStatus.set("saved");
  } catch {
    saveStatus.set("error");
  }
}

export async function createFile(path: string, content = "") {
  await api.files.write(path, content);
  const dir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
  await loadDir(dir);
  await openFile(path);
}

export async function createDir(path: string) {
  await api.files.mkdir(path);
  const parentDir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
  await loadDir(parentDir);
}

export async function deleteFileAction(path: string) {
  await api.files.delete(path);
  const dir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
  await loadDir(dir);

  if (get(activeFile) === path) {
    activeFile.set(null);
    activeContent.set("");
  }
}
```

- [ ] **Step 10: Create remaining stores**

Create `src/lib/stores/editor.ts`:

```typescript
import { writable } from "svelte/store";

export const editorMode = writable<"edit" | "preview">("edit");
export const cursorLine = writable(1);
export const cursorCol = writable(1);
```

Create `src/lib/stores/search.ts`:

```typescript
import { writable } from "svelte/store";
import { api, type SearchResult } from "$lib/services/api";

export const searchQuery = writable("");
export const searchResults = writable<SearchResult[]>([]);
export const searchActive = writable(false);

export async function performSearch(query: string) {
  if (!query.trim()) {
    searchResults.set([]);
    searchActive.set(false);
    return;
  }
  searchActive.set(true);
  const results = await api.search(query);
  searchResults.set(results);
}
```

Create `src/lib/stores/tags.ts`:

```typescript
import { writable } from "svelte/store";
import { api, type TagEntry, type TagFile } from "$lib/services/api";

export const allTags = writable<TagEntry[]>([]);
export const activeTag = writable<string | null>(null);
export const activeTagFiles = writable<TagFile[]>([]);

export async function loadTags() {
  const tags = await api.tags.list();
  allTags.set(tags);
}

export async function selectTag(tag: string) {
  activeTag.set(tag);
  const files = await api.tags.files(tag);
  activeTagFiles.set(files);
}

export function clearTag() {
  activeTag.set(null);
  activeTagFiles.set([]);
}
```

Create `src/lib/stores/graph.ts`:

```typescript
import { writable } from "svelte/store";
import { api, type GraphData } from "$lib/services/api";

export const graphData = writable<GraphData>({ nodes: [], edges: [] });

export async function loadGraph() {
  const data = await api.links.graph();
  graphData.set(data);
}
```

- [ ] **Step 11: Run tests**

Run: `npx vitest run`
Expected: All tests PASS (server + client).

- [ ] **Step 12: Commit**

```bash
git add src/lib/ tests/unit/services/ tests/unit/utils/
git commit -m "feat: frontend stores, API client, fuzzy search, path utilities"
```

---

## Task 5: Frontend — AppShell + Sidebar + FileTree

**Files:**
- Create: `src/lib/components/AppShell.svelte`
- Create: `src/lib/components/Sidebar.svelte`
- Create: `src/lib/components/FileTree.svelte`
- Create: `src/lib/components/FileTreeNode.svelte`
- Create: `src/lib/components/ThemeToggle.svelte`
- Modify: `src/App.svelte`

- [ ] **Step 1: Create ThemeToggle.svelte**

```svelte
<script lang="ts">
  import { theme } from "$lib/stores/ui";
</script>

<button
  onclick={() => theme.toggle()}
  class="p-2 rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
  aria-label="Toggle theme"
  title={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {#if $theme === 'dark'}
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  {:else}
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  {/if}
</button>
```

- [ ] **Step 2: Create FileTreeNode.svelte**

```svelte
<script lang="ts">
  import type { FileEntry } from "$lib/services/api";
  import { activeFile, loadDir, openFile, expandedDirs, childrenByDir } from "$lib/stores/vault";

  export let entry: FileEntry;
  export let depth: number = 0;

  let expanded = false;
  let children: FileEntry[] = [];

  $: expanded = $expandedDirs.has(entry.path);
  $: children = $childrenByDir.get(entry.path) || [];
  $: isActive = $activeFile === entry.path;

  async function toggle() {
    if (entry.type === "dir") {
      expandedDirs.update((s) => {
        const next = new Set(s);
        if (next.has(entry.path)) next.delete(entry.path);
        else next.add(entry.path);
        return next;
      });
      if (!$childrenByDir.has(entry.path)) {
        await loadDir(entry.path);
      }
    } else {
      await openFile(entry.path);
    }
  }
</script>

<div class="tree-node">
  <button
    onclick={toggle}
    class="flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors text-left gap-2
      {isActive ? 'bg-[var(--accent-dim)] text-[var(--accent)]' : 'hover:bg-[var(--surface-hover)] text-[var(--text)]'}"
    style="padding-left: {12 + depth * 16}px; min-height: 36px;"
  >
    {#if entry.type === "dir"}
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 transition-transform {expanded ? 'rotate-90' : ''}">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0" style="color: var(--text-muted);">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    {:else}
      <span class="w-[14px] shrink-0"></span>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0" style="color: var(--text-muted);">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    {/if}
    <span class="truncate">{entry.name}</span>
  </button>

  {#if entry.type === "dir" && expanded}
    <div>
      {#each children as child (child.path)}
        <svelte:self entry={child} depth={depth + 1} />
      {/each}
    </div>
  {/if}
</div>
```

- [ ] **Step 3: Create FileTree.svelte**

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { childrenByDir, loadDir } from "$lib/stores/vault";
  import FileTreeNode from "./FileTreeNode.svelte";

  let rootEntries: any[] = [];

  $: rootEntries = $childrenByDir.get("") || [];

  onMount(async () => {
    await loadDir("");
  });
</script>

<div class="flex-1 overflow-y-auto py-1" role="tree">
  {#each rootEntries as entry (entry.path)}
    <FileTreeNode {entry} />
  {/each}

  {#if rootEntries.length === 0}
    <p class="px-4 py-8 text-center text-sm" style="color: var(--text-muted);">
      No notes yet. Create one to get started.
    </p>
  {/if}
</div>
```

- [ ] **Step 4: Create Sidebar.svelte**

```svelte
<script lang="ts">
  import FileTree from "./FileTree.svelte";
  import ThemeToggle from "./ThemeToggle.svelte";
  import { searchQuery, performSearch, searchActive } from "$lib/stores/search";
  import { sidebarOpen } from "$lib/stores/ui";
  import { createFile, createDir } from "$lib/stores/vault";
  import { debounce } from "$lib/utils/debounce";

  let searchInput = "";
  let newFileName = "";

  const debouncedSearch = debounce((q: string) => {
    searchQuery.set(q);
    if (q.length >= 2) performSearch(q);
    else { searchQuery.set(""); searchActive.set(false); }
  }, 300);

  function onSearchInput(e: Event) {
    searchInput = (e.target as HTMLInputElement).value;
    debouncedSearch(searchInput);
  }

  async function onNewNote() {
    const name = prompt("Note name:");
    if (!name) return;
    const path = name.endsWith(".md") ? name : `${name}.md`;
    await createFile(path, `# ${name.replace(".md", "")}\n\n`);
  }

  async function onNewFolder() {
    const name = prompt("Folder name:");
    if (!name) return;
    await createDir(name);
  }
</script>

<aside class="flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)]" style="width: 280px; min-width: 280px;">
  <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
    <h1 class="text-lg font-semibold" style="color: var(--accent);">Synapse</h1>
    <div class="flex items-center gap-1">
      <ThemeToggle />
      <button
        onclick={() => sidebarOpen.set(false)}
        class="p-2 rounded-lg transition-colors hover:bg-[var(--surface-hover)] md:hidden"
        aria-label="Close sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="px-3 py-2">
    <input
      type="text"
      placeholder="Search notes..."
      value={searchInput}
      oninput={onSearchInput}
      class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
    />
  </div>

  <div class="flex items-center gap-1 px-3 pb-2">
    <button
      onclick={onNewNote}
      class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Note
    </button>
    <button
      onclick={onNewFolder}
      class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Folder
    </button>
  </div>

  <FileTree />
</aside>
```

- [ ] **Step 5: Create AppShell.svelte**

```svelte
<script lang="ts">
  import Sidebar from "./Sidebar.svelte";
  import { sidebarOpen } from "$lib/stores/ui";
  import { activeFile } from "$lib/stores/vault";

  let touchStartX = 0;

  function onTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }

  function onTouchEnd(e: TouchEvent) {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (touchStartX < 30 && diff > 80) sidebarOpen.set(true);
    if ($sidebarOpen && diff < -80) sidebarOpen.set(false);
  }
</script>

<div
  class="flex h-full overflow-hidden"
  ontouchstart={onTouchStart}
  ontouchend={onTouchEnd}
>
  <!-- Desktop sidebar -->
  <div class="hidden md:flex shrink-0 {$sidebarOpen ? '' : 'md:hidden'}">
    <Sidebar />
  </div>

  <!-- Mobile sidebar overlay -->
  {#if $sidebarOpen}
    <div class="md:hidden fixed inset-0 z-40">
      <div
        class="absolute inset-0 bg-black/50"
        onclick={() => sidebarOpen.set(false)}
      ></div>
      <div class="relative z-50 h-full" style="width: 280px;">
        <Sidebar />
      </div>
    </div>
  {/if}

  <!-- Main content -->
  <main class="flex-1 flex flex-col min-w-0 bg-[var(--bg)]">
    {#if !$activeFile}
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <button
            class="md:hidden mb-4 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm"
            onclick={() => sidebarOpen.set(true)}
          >
            Open sidebar
          </button>
          <h2 class="text-2xl font-bold mb-2" style="color: var(--accent);">Synapse</h2>
          <p style="color: var(--text-muted);">Select a note or create a new one</p>
        </div>
      </div>
    {:else}
      <div class="flex-1 flex flex-col min-h-0">
        <slot />
      </div>
    {/if}

    <!-- Mobile hamburger -->
    {#if !$sidebarOpen}
      <button
        class="md:hidden fixed top-3 left-3 z-30 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-lg"
        onclick={() => sidebarOpen.set(true)}
        aria-label="Open sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    {/if}
  </main>
</div>
```

- [ ] **Step 6: Update src/App.svelte**

```svelte
<script lang="ts">
  import AppShell from "$lib/components/AppShell.svelte";
</script>

<AppShell />
```

- [ ] **Step 7: Build and test in browser**

Run: `npm run build && node server/index.js --vault ./test-vault`
Open `http://localhost:5173` — verify sidebar shows with file tree, theme toggle works, files can be clicked.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat: frontend shell — sidebar, file tree, theme toggle, responsive layout"
```

---

## Task 6: Frontend — CodeMirror Editor with Auto-Save

**Files:**
- Create: `src/lib/editor/theme.ts`
- Create: `src/lib/editor/markdown.ts`
- Create: `src/lib/editor/keymaps.ts`
- Create: `src/lib/components/Editor.svelte`
- Create: `src/lib/components/EditorToolbar.svelte`
- Modify: `src/lib/components/AppShell.svelte` (render Editor when file active)

- [ ] **Step 1: Create src/lib/editor/theme.ts**

```typescript
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
```

- [ ] **Step 2: Create src/lib/editor/markdown.ts**

```typescript
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
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

export function createMarkdownExtensions() {
  return [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    markdownHighlighting,
  ];
}
```

- [ ] **Step 3: Create src/lib/editor/keymaps.ts**

```typescript
import { keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

export function createKeymapExtensions(onSave: () => void) {
  return [
    history(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      {
        key: "Mod-s",
        run: () => {
          onSave();
          return true;
        },
      },
    ]),
  ];
}
```

- [ ] **Step 4: Create src/lib/components/Editor.svelte**

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { lineNumbers, highlightActiveLine } from "@codemirror/view";
  import { activeFile, activeContent, dirty, saveStatus, saveFile } from "$lib/stores/vault";
  import { cursorLine, cursorCol } from "$lib/stores/editor";
  import { synapseThemeDark } from "$lib/editor/theme";
  import { createMarkdownExtensions } from "$lib/editor/markdown";
  import { createKeymapExtensions } from "$lib/editor/keymaps";
  import { debounce } from "$lib/utils/debounce";

  let editorContainer: HTMLDivElement;
  let view: EditorView | null = null;
  let currentFile: string | null = null;

  const AUTOSAVE_DELAY = 1200;
  const debouncedSave = debounce(() => saveFile(), AUTOSAVE_DELAY);

  function createEditor(content: string) {
    if (view) view.destroy();

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        synapseThemeDark,
        ...createMarkdownExtensions(),
        ...createKeymapExtensions(() => saveFile()),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const doc = update.state.doc.toString();
            activeContent.set(doc);
            dirty.set(true);
            saveStatus.set("unsaved");
            debouncedSave();
          }
          if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            cursorLine.set(line.number);
            cursorCol.set(pos - line.from + 1);
          }
        }),
        EditorView.lineWrapping,
      ],
    });

    view = new EditorView({ state, parent: editorContainer });
  }

  $: if ($activeFile && $activeFile !== currentFile) {
    currentFile = $activeFile;
    if (editorContainer) createEditor($activeContent);
  }

  onMount(() => {
    if ($activeFile) createEditor($activeContent);
  });

  onDestroy(() => {
    if (view) view.destroy();
  });
</script>

<div class="flex flex-col h-full min-h-0">
  <!-- Top bar -->
  <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
    <span class="text-sm truncate" style="color: var(--text-muted);">{$activeFile || ""}</span>
    <div class="flex items-center gap-2">
      <span class="text-xs px-2 py-0.5 rounded-full
        {$saveStatus === 'saved' ? 'text-green-400' : ''}
        {$saveStatus === 'saving' ? 'text-yellow-400' : ''}
        {$saveStatus === 'unsaved' ? 'text-orange-400' : ''}
        {$saveStatus === 'error' ? 'text-red-400' : ''}"
      >
        {$saveStatus === 'saved' ? 'Saved' : ''}
        {$saveStatus === 'saving' ? 'Saving...' : ''}
        {$saveStatus === 'unsaved' ? 'Unsaved' : ''}
        {$saveStatus === 'error' ? 'Error saving' : ''}
      </span>
    </div>
  </div>

  <!-- Editor -->
  <div bind:this={editorContainer} class="flex-1 overflow-auto"></div>

  <!-- Status bar -->
  <div class="flex items-center justify-between px-4 py-1 border-t border-[var(--border)] bg-[var(--surface)] text-xs shrink-0" style="color: var(--text-muted);">
    <span>Ln {$cursorLine}, Col {$cursorCol}</span>
    <span>Markdown</span>
  </div>
</div>
```

- [ ] **Step 5: Create src/lib/components/EditorToolbar.svelte**

```svelte
<script lang="ts">
</script>

<div class="md:hidden flex items-center gap-1 px-2 py-1.5 border-t border-[var(--border)] bg-[var(--surface)] overflow-x-auto shrink-0">
  {#each [
    { label: "B", title: "Bold", format: "**" },
    { label: "I", title: "Italic", format: "*" },
    { label: "H", title: "Heading", format: "# " },
    { label: "[[", title: "Link", format: "[[" },
    { label: "#", title: "Tag", format: "#" },
    { label: "•", title: "List", format: "- " },
    { label: "☐", title: "Checkbox", format: "- [ ] " },
  ] as btn}
    <button
      class="px-3 py-1.5 text-sm font-mono rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
      title={btn.title}
    >
      {btn.label}
    </button>
  {/each}
</div>
```

- [ ] **Step 6: Update AppShell.svelte to render Editor**

Replace the `<slot />` in the active-file block with:

```svelte
<script lang="ts">
  import Sidebar from "./Sidebar.svelte";
  import Editor from "./Editor.svelte";
  import EditorToolbar from "./EditorToolbar.svelte";
  import { sidebarOpen } from "$lib/stores/ui";
  import { activeFile } from "$lib/stores/vault";
  // ... keep existing touch handlers
</script>

<!-- In the activeFile block, replace <slot /> with: -->
{:else}
  <div class="flex-1 flex flex-col min-h-0">
    <Editor />
    <EditorToolbar />
  </div>
{/if}
```

- [ ] **Step 7: Add @lezer/highlight dependency**

Add to package.json dependencies: `"@lezer/highlight": "^1.2.0"` and `"@codemirror/language": "^6.10.0"`

Run: `npm install`

- [ ] **Step 8: Build and test**

Run: `npm run build && node server/index.js --vault ./test-vault`
Open browser: click a file, verify CodeMirror loads with syntax highlighting, auto-save works, cursor position shows.

- [ ] **Step 9: Commit**

```bash
git add src/lib/editor/ src/lib/components/
git commit -m "feat: CodeMirror 6 editor with markdown highlighting, auto-save, status bar"
```

---

## Task 7: Frontend — Wikilink Navigation + Autocomplete

**Files:**
- Create: `src/lib/editor/wikilink.ts`
- Modify: `src/lib/components/Editor.svelte` (add wikilink extension)
- Modify: `src/lib/stores/vault.ts` (add navigation by link target)

- [ ] **Step 1: Add link resolution to vault store**

Add to `src/lib/stores/vault.ts`:

```typescript
export async function navigateToLink(target: string) {
  const files = get(allFiles);
  const targetLower = target.toLowerCase().replace(/\.md$/i, "");

  const match = files.find((f) => {
    const name = f.replace(/\.md$/i, "").toLowerCase();
    const baseName = name.includes("/") ? name.substring(name.lastIndexOf("/") + 1) : name;
    return baseName === targetLower || name === targetLower;
  });

  if (match) {
    await openFile(match);
  } else {
    const path = `${target}.md`;
    await createFile(path, `# ${target}\n\n`);
  }
}

export async function loadAllFiles(dir = ""): Promise<void> {
  const entries = await api.files.list(dir);
  childrenByDir.update((m) => {
    m.set(dir, entries);
    return new Map(m);
  });

  for (const entry of entries) {
    if (entry.type === "file") {
      allFiles.update((existing) => {
        const set = new Set(existing);
        set.add(entry.path);
        return [...set];
      });
    } else if (entry.type === "dir") {
      await loadAllFiles(entry.path);
    }
  }
}
```

- [ ] **Step 2: Create src/lib/editor/wikilink.ts**

```typescript
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { EditorView, Decoration, type DecorationSet, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

export function wikilinkAutocomplete(getFiles: () => string[]) {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        const before = context.matchBefore(/\[\[[^\]]*$/);
        if (!before) return null;

        const query = before.text.slice(2).toLowerCase();
        const files = getFiles();

        const options = files
          .filter((f) => f.endsWith(".md"))
          .map((f) => {
            const name = f.replace(/\.md$/, "");
            const baseName = name.includes("/") ? name.substring(name.lastIndexOf("/") + 1) : name;
            return { label: baseName, detail: f, apply: `${baseName}]]` };
          })
          .filter((o) => o.label.toLowerCase().includes(query));

        return {
          from: before.from + 2,
          options,
          filter: false,
        };
      },
    ],
  });
}

const wikilinkRE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    let match;
    wikilinkRE.lastIndex = 0;

    while ((match = wikilinkRE.exec(line.text)) !== null) {
      const from = line.from + match.index;
      const to = from + match[0].length;
      builder.add(
        from,
        to,
        Decoration.mark({ class: "cm-wikilink", attributes: { "data-target": match[1] } })
      );
    }
  }

  return builder.finish();
}

export const wikilinkDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

export const wikilinkStyles = EditorView.baseTheme({
  ".cm-wikilink": {
    color: "var(--accent)",
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationColor: "var(--accent-dim)",
    textUnderlineOffset: "2px",
  },
});

export function wikilinkClickHandler(onNavigate: (target: string) => void) {
  return EditorView.domEventHandlers({
    click(event: MouseEvent, view: EditorView) {
      if (!(event.ctrlKey || event.metaKey)) {
        if (window.innerWidth >= 768) return false;
      }

      const target = event.target as HTMLElement;
      const wikilink = target.closest(".cm-wikilink") as HTMLElement | null;
      if (wikilink) {
        const linkTarget = wikilink.dataset.target;
        if (linkTarget) {
          event.preventDefault();
          onNavigate(linkTarget);
          return true;
        }
      }
      return false;
    },
  });
}
```

- [ ] **Step 3: Add wikilink extensions to Editor.svelte**

In the imports, add:

```typescript
import { wikilinkAutocomplete, wikilinkDecorations, wikilinkStyles, wikilinkClickHandler } from "$lib/editor/wikilink";
import { allFiles, navigateToLink, loadAllFiles } from "$lib/stores/vault";
import { get } from "svelte/store";
```

In `createEditor`, add these to the extensions array:

```typescript
wikilinkAutocomplete(() => get(allFiles)),
wikilinkDecorations,
wikilinkStyles,
wikilinkClickHandler((target) => navigateToLink(target)),
```

In `onMount`, also load all files for autocomplete:

```typescript
onMount(async () => {
  await loadAllFiles();
  if ($activeFile) createEditor($activeContent);
});
```

- [ ] **Step 4: Build and test**

Run: `npm run build && node server/index.js --vault ./test-vault`
Open browser: open a file, type `[[`, verify autocomplete shows notes. Ctrl+click a wikilink, verify navigation. Click a link to a non-existent note, verify it creates the note.

- [ ] **Step 5: Commit**

```bash
git add src/lib/editor/wikilink.ts src/lib/components/Editor.svelte src/lib/stores/vault.ts
git commit -m "feat: wikilink navigation — autocomplete on [[, click to navigate, auto-create new notes"
```

---

## Task 8: Frontend — Backlinks Panel

**Files:**
- Create: `src/lib/components/BacklinksPanel.svelte`
- Modify: `src/lib/components/AppShell.svelte` (render backlinks below editor)

- [ ] **Step 1: Create BacklinksPanel.svelte**

```svelte
<script lang="ts">
  import { activeFile, navigateToLink } from "$lib/stores/vault";
  import { backlinksOpen } from "$lib/stores/ui";
  import { api, type BacklinkEntry } from "$lib/services/api";
  import { stripExtension, basename } from "$lib/utils/paths";

  let backlinks: BacklinkEntry[] = [];
  let loading = false;

  $: if ($activeFile) loadBacklinks($activeFile);

  async function loadBacklinks(path: string) {
    loading = true;
    try {
      backlinks = await api.links.backlinks(path);
    } catch {
      backlinks = [];
    }
    loading = false;
  }

  function highlightLink(context: string): string {
    return context.replace(
      /\[\[([^\]]+)\]\]/g,
      '<span style="color: var(--accent); font-weight: 500;">&#91;&#91;$1&#93;&#93;</span>'
    );
  }
</script>

{#if $activeFile}
  <div class="border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
    <button
      onclick={() => backlinksOpen.update(v => !v)}
      class="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors"
    >
      <span class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transition-transform {$backlinksOpen ? 'rotate-90' : ''}">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        Backlinks
        <span class="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent-dim)]" style="color: var(--accent);">{backlinks.length}</span>
      </span>
    </button>

    {#if $backlinksOpen}
      <div class="px-4 pb-3 max-h-48 overflow-y-auto">
        {#if loading}
          <p class="text-xs py-2" style="color: var(--text-muted);">Loading...</p>
        {:else if backlinks.length === 0}
          <p class="text-xs py-2" style="color: var(--text-muted);">No other notes link here yet.</p>
        {:else}
          {#each backlinks as link}
            <button
              onclick={() => navigateToLink(stripExtension(basename(link.source)))}
              class="block w-full text-left px-3 py-2 mb-1 rounded-md text-sm hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div class="font-medium text-xs" style="color: var(--accent);">{stripExtension(basename(link.source))}</div>
              <div class="text-xs mt-0.5 truncate" style="color: var(--text-muted);">
                {@html highlightLink(link.context)}
              </div>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
{/if}
```

- [ ] **Step 2: Add BacklinksPanel to AppShell**

In the `{:else}` block (active file), add after `<Editor />` and before `<EditorToolbar />`:

```svelte
import BacklinksPanel from "./BacklinksPanel.svelte";

<!-- In the active file block -->
<Editor />
<BacklinksPanel />
<EditorToolbar />
```

- [ ] **Step 3: Build and test**

Run: `npm run build && node server/index.js --vault ./test-vault`
Open Second.md (which links to Welcome), then open Welcome.md — verify backlinks panel shows "Second" with context.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/BacklinksPanel.svelte src/lib/components/AppShell.svelte
git commit -m "feat: backlinks panel — shows notes linking to current note with context"
```

---

## Task 9: Frontend — Tags Panel

**Files:**
- Create: `src/lib/components/TagsPanel.svelte`
- Create: `src/lib/components/TagCloud.svelte`
- Modify: `src/lib/components/Sidebar.svelte` (add tags section)

- [ ] **Step 1: Create TagCloud.svelte**

```svelte
<script lang="ts">
  import type { TagEntry } from "$lib/services/api";
  import { selectTag, activeTag } from "$lib/stores/tags";

  export let tags: TagEntry[] = [];

  function sizeClass(count: number, max: number): string {
    const ratio = max > 0 ? count / max : 0;
    if (ratio > 0.7) return "text-lg font-semibold";
    if (ratio > 0.4) return "text-base font-medium";
    return "text-sm";
  }

  $: maxCount = Math.max(...tags.map((t) => t.count), 1);
</script>

<div class="flex flex-wrap gap-2 px-1">
  {#each tags as tag}
    <button
      onclick={() => selectTag(tag.tag)}
      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors
        {$activeTag === tag.tag
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[var(--accent-dim)] hover:bg-[var(--accent)] hover:text-white'}"
      style={$activeTag === tag.tag ? '' : 'color: var(--accent);'}
    >
      <span class={sizeClass(tag.count, maxCount)}>#{tag.tag}</span>
      <span class="text-xs opacity-70">{tag.count}</span>
    </button>
  {/each}
</div>
```

- [ ] **Step 2: Create TagsPanel.svelte**

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { allTags, loadTags, activeTag, activeTagFiles, clearTag } from "$lib/stores/tags";
  import { openFile } from "$lib/stores/vault";
  import { basename, stripExtension } from "$lib/utils/paths";
  import TagCloud from "./TagCloud.svelte";

  let expanded = true;

  onMount(() => loadTags());
</script>

<div class="border-t border-[var(--border)]">
  <button
    onclick={() => expanded = !expanded}
    class="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors"
  >
    <span class="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transition-transform {expanded ? 'rotate-90' : ''}">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
      Tags
      <span class="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent-dim)]" style="color: var(--accent);">{$allTags.length}</span>
    </span>
  </button>

  {#if expanded}
    <div class="px-3 pb-3">
      {#if $allTags.length === 0}
        <p class="text-xs py-2" style="color: var(--text-muted);">No tags yet. Use #tag in your notes.</p>
      {:else}
        <TagCloud tags={$allTags} />

        {#if $activeTag}
          <div class="mt-3 border-t border-[var(--border)] pt-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium" style="color: var(--accent);">#{$activeTag}</span>
              <button
                onclick={() => clearTag()}
                class="text-xs px-2 py-0.5 rounded hover:bg-[var(--surface-hover)]"
                style="color: var(--text-muted);"
              >Clear</button>
            </div>
            {#each $activeTagFiles as file}
              <button
                onclick={() => openFile(file.path)}
                class="block w-full text-left px-2 py-1.5 text-xs rounded hover:bg-[var(--surface-hover)] truncate transition-colors"
              >
                {stripExtension(basename(file.path))}
                <span class="opacity-50">:{file.lineNumber}</span>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>
```

- [ ] **Step 3: Add TagsPanel to Sidebar**

In `Sidebar.svelte`, add import and render after `<FileTree />`:

```svelte
import TagsPanel from "./TagsPanel.svelte";

<!-- After <FileTree /> -->
<TagsPanel />
```

- [ ] **Step 4: Build and test**

Run: `npm run build && node server/index.js --vault ./test-vault`
Verify tags panel appears in sidebar, shows `#getting-started` from test vault, clicking filters files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/TagsPanel.svelte src/lib/components/TagCloud.svelte src/lib/components/Sidebar.svelte
git commit -m "feat: tags panel — tag cloud with filtering, file list per tag"
```

---

## Task 10: Frontend — Search + Quick Switcher

**Files:**
- Create: `src/lib/components/SearchResults.svelte`
- Create: `src/lib/components/QuickSwitcher.svelte`
- Create: `src/lib/services/keybindings.ts`
- Modify: `src/lib/components/Sidebar.svelte` (show search results)
- Modify: `src/App.svelte` (add keybindings + quick switcher)

- [ ] **Step 1: Create SearchResults.svelte**

```svelte
<script lang="ts">
  import { searchResults, searchActive, searchQuery } from "$lib/stores/search";
  import { openFile } from "$lib/stores/vault";
  import { basename, stripExtension } from "$lib/utils/paths";

  function highlight(text: string, query: string): string {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), '<mark class="bg-[var(--accent-dim)] text-[var(--accent)] rounded px-0.5">$1</mark>');
  }
</script>

{#if $searchActive}
  <div class="flex-1 overflow-y-auto py-2">
    <div class="px-3 pb-2 flex items-center justify-between">
      <span class="text-xs" style="color: var(--text-muted);">
        {$searchResults.length} result{$searchResults.length !== 1 ? 's' : ''}
      </span>
      <button
        onclick={() => { searchQuery.set(""); searchActive.set(false); }}
        class="text-xs px-2 py-0.5 rounded hover:bg-[var(--surface-hover)]"
        style="color: var(--text-muted);"
      >Clear</button>
    </div>

    {#each $searchResults as result}
      <div class="px-3 mb-2">
        <button
          onclick={() => openFile(result.path)}
          class="text-xs font-medium mb-1 hover:underline"
          style="color: var(--accent);"
        >
          {stripExtension(basename(result.path))}
        </button>
        {#each result.matches.slice(0, 3) as match}
          <button
            onclick={() => openFile(result.path)}
            class="block w-full text-left px-2 py-1 text-xs rounded hover:bg-[var(--surface-hover)] transition-colors truncate"
            style="color: var(--text-muted);"
          >
            <span class="opacity-50">{match.lineNumber}:</span>
            {@html highlight(match.content, $searchQuery)}
          </button>
        {/each}
      </div>
    {/each}

    {#if $searchResults.length === 0}
      <p class="px-4 py-4 text-center text-xs" style="color: var(--text-muted);">No results found.</p>
    {/if}
  </div>
{/if}
```

- [ ] **Step 2: Update Sidebar to show SearchResults**

In `Sidebar.svelte`, add:

```svelte
import SearchResults from "./SearchResults.svelte";
import { searchActive } from "$lib/stores/search";

<!-- Replace <FileTree /> with conditional: -->
{#if $searchActive}
  <SearchResults />
{:else}
  <FileTree />
{/if}
```

- [ ] **Step 3: Create QuickSwitcher.svelte**

```svelte
<script lang="ts">
  import { allFiles, openFile } from "$lib/stores/vault";
  import { recentFiles } from "$lib/stores/vault";
  import { fuzzySort } from "$lib/services/fuzzy";
  import { basename, stripExtension } from "$lib/utils/paths";

  export let open = false;

  let query = "";
  let selectedIndex = 0;
  let inputEl: HTMLInputElement;
  let results: string[] = [];

  $: {
    if (query) {
      results = fuzzySort(
        query,
        $allFiles.filter((f) => f.endsWith(".md")).map((f) => stripExtension(basename(f)))
      ).map((name) => $allFiles.find((f) => stripExtension(basename(f)) === name)!).filter(Boolean);
    } else {
      results = $recentFiles.slice(0, 10);
    }
    selectedIndex = 0;
  }

  function select(path: string) {
    openFile(path);
    close();
  }

  function close() {
    open = false;
    query = "";
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      select(results[selectedIndex]);
    } else if (e.key === "Escape") {
      close();
    }
  }

  $: if (open && inputEl) {
    setTimeout(() => inputEl?.focus(), 50);
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] md:pt-[15vh]">
    <div class="absolute inset-0 bg-black/60" onclick={close}></div>
    <div class="relative w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
      <div class="px-4 py-3 border-b border-[var(--border)]">
        <input
          bind:this={inputEl}
          bind:value={query}
          onkeydown={onKeydown}
          type="text"
          placeholder="Jump to note..."
          class="w-full bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none text-lg"
        />
      </div>
      <div class="max-h-80 overflow-y-auto py-1">
        {#if results.length === 0}
          <p class="px-4 py-6 text-center text-sm" style="color: var(--text-muted);">
            {query ? "No matching notes" : "No recent files"}
          </p>
        {:else}
          {#each results as path, i}
            <button
              onclick={() => select(path)}
              class="flex items-center w-full px-4 py-2.5 text-sm transition-colors
                {i === selectedIndex ? 'bg-[var(--accent-dim)]' : 'hover:bg-[var(--surface-hover)]'}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mr-3" style="color: var(--text-muted);">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <div class="text-left min-w-0">
                <div class="truncate" style="color: {i === selectedIndex ? 'var(--accent)' : 'var(--text)'};">
                  {stripExtension(basename(path))}
                </div>
                <div class="text-xs truncate" style="color: var(--text-muted);">{path}</div>
              </div>
            </button>
          {/each}
        {/if}
      </div>
      <div class="px-4 py-2 border-t border-[var(--border)] text-xs" style="color: var(--text-muted);">
        <span class="mr-3">↑↓ navigate</span>
        <span class="mr-3">↵ open</span>
        <span>esc close</span>
      </div>
    </div>
  </div>
{/if}
```

- [ ] **Step 4: Create src/lib/services/keybindings.ts**

```typescript
type Handler = () => void;

const bindings = new Map<string, Handler>();

export function registerKeybinding(key: string, handler: Handler) {
  bindings.set(key.toLowerCase(), handler);
}

export function initKeybindings() {
  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    let key = "";

    if (mod && shift) key = `mod+shift+${e.key.toLowerCase()}`;
    else if (mod) key = `mod+${e.key.toLowerCase()}`;

    const handler = bindings.get(key);
    if (handler) {
      e.preventDefault();
      handler();
    }
  });
}
```

- [ ] **Step 5: Update App.svelte with keybindings + QuickSwitcher**

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import AppShell from "$lib/components/AppShell.svelte";
  import QuickSwitcher from "$lib/components/QuickSwitcher.svelte";
  import { registerKeybinding, initKeybindings } from "$lib/services/keybindings";
  import { sidebarOpen, backlinksOpen, graphOpen } from "$lib/stores/ui";
  import { saveFile } from "$lib/stores/vault";

  let quickSwitcherOpen = false;

  onMount(() => {
    registerKeybinding("mod+k", () => quickSwitcherOpen = !quickSwitcherOpen);
    registerKeybinding("mod+s", () => saveFile());
    registerKeybinding("mod+\\", () => sidebarOpen.update(v => !v));
    registerKeybinding("mod+.", () => backlinksOpen.update(v => !v));
    registerKeybinding("mod+g", () => graphOpen.update(v => !v));
    registerKeybinding("mod+shift+f", () => {
      sidebarOpen.set(true);
      setTimeout(() => document.querySelector<HTMLInputElement>('.sidebar input[type="text"]')?.focus(), 100);
    });
    initKeybindings();
  });
</script>

<AppShell />
<QuickSwitcher bind:open={quickSwitcherOpen} />
```

- [ ] **Step 6: Build and test**

Run: `npm run build && node server/index.js --vault ./test-vault`
Test: Cmd+K opens quick switcher, typing filters notes, Enter opens. Search in sidebar returns full-text results.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/SearchResults.svelte src/lib/components/QuickSwitcher.svelte src/lib/services/keybindings.ts src/lib/components/Sidebar.svelte src/App.svelte
git commit -m "feat: full-text search + quick switcher (Cmd+K) with fuzzy matching"
```

---

## Task 11: Frontend — Graph View

**Files:**
- Create: `src/lib/components/GraphView.svelte`
- Modify: `src/lib/components/AppShell.svelte` (toggle graph view)

- [ ] **Step 1: Create GraphView.svelte**

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { graphData, loadGraph } from "$lib/stores/graph";
  import { graphOpen } from "$lib/stores/ui";
  import { activeFile, openFile } from "$lib/stores/vault";
  import { stripExtension, basename } from "$lib/utils/paths";
  import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";

  let canvas: HTMLCanvasElement;
  let animationFrame: number;
  let simulation: any;
  let nodes: any[] = [];
  let links: any[] = [];
  let width = 800;
  let height = 600;
  let transform = { x: 0, y: 0, k: 1 };
  let dragging: any = null;

  $: if ($graphOpen) {
    loadGraph().then(() => initSimulation());
  }

  function initSimulation() {
    const data = $graphData;
    nodes = data.nodes.map((n) => ({ ...n, x: Math.random() * width, y: Math.random() * height }));
    links = data.edges.map((e) => ({
      source: nodes.find((n) => n.id === e.source),
      target: nodes.find((n) => n.id === e.target),
    })).filter((l) => l.source && l.target);

    simulation = forceSimulation(nodes)
      .force("link", forceLink(links).distance(100).strength(0.3))
      .force("charge", forceManyBody().strength(-200))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide(30))
      .on("tick", draw);
  }

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    const style = getComputedStyle(document.documentElement);
    const borderColor = style.getPropertyValue("--border").trim();
    const textColor = style.getPropertyValue("--text").trim();
    const accentColor = style.getPropertyValue("--accent").trim();
    const mutedColor = style.getPropertyValue("--text-muted").trim();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    for (const link of links) {
      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      ctx.stroke();
    }

    for (const node of nodes) {
      const isActive = node.id === $activeFile;
      const radius = isActive ? 8 : 5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? accentColor : mutedColor;
      ctx.fill();

      if (transform.k > 0.5) {
        ctx.fillStyle = isActive ? accentColor : textColor;
        ctx.font = `${isActive ? "bold " : ""}${11 / transform.k}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(stripExtension(basename(node.title)), node.x, node.y - radius - 4);
      }
    }

    ctx.restore();
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    transform.k *= factor;
    transform.k = Math.max(0.1, Math.min(5, transform.k));
    draw();
  }

  function onMouseDown(e: MouseEvent) {
    const mx = (e.offsetX - transform.x) / transform.k;
    const my = (e.offsetY - transform.y) / transform.k;

    for (const node of nodes) {
      const dx = mx - node.x;
      const dy = my - node.y;
      if (dx * dx + dy * dy < 400) {
        dragging = node;
        return;
      }
    }

    dragging = { isPan: true, startX: e.offsetX - transform.x, startY: e.offsetY - transform.y };
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging) return;
    if (dragging.isPan) {
      transform.x = e.offsetX - dragging.startX;
      transform.y = e.offsetY - dragging.startY;
      draw();
    } else {
      dragging.fx = (e.offsetX - transform.x) / transform.k;
      dragging.fy = (e.offsetY - transform.y) / transform.k;
      simulation?.alpha(0.3).restart();
    }
  }

  function onMouseUp(e: MouseEvent) {
    if (dragging && !dragging.isPan) {
      dragging.fx = null;
      dragging.fy = null;
    }
    dragging = null;
  }

  function onClick(e: MouseEvent) {
    const mx = (e.offsetX - transform.x) / transform.k;
    const my = (e.offsetY - transform.y) / transform.k;

    for (const node of nodes) {
      const dx = mx - node.x;
      const dy = my - node.y;
      if (dx * dx + dy * dy < 400) {
        openFile(node.id);
        graphOpen.set(false);
        return;
      }
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      width = rect.width;
      height = rect.height;
      canvas.width = width;
      canvas.height = height;
      draw();
    }
  }

  onMount(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  });

  onDestroy(() => {
    if (simulation) simulation.stop();
    if (animationFrame) cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", resizeCanvas);
  });
</script>

{#if $graphOpen}
  <div class="fixed inset-0 z-50 bg-[var(--bg)]">
    <div class="absolute top-4 right-4 z-10 flex items-center gap-2">
      <button
        onclick={() => graphOpen.set(false)}
        class="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
        aria-label="Close graph"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <canvas
      bind:this={canvas}
      class="w-full h-full cursor-grab active:cursor-grabbing"
      onwheel={onWheel}
      onmousedown={onMouseDown}
      onmousemove={onMouseMove}
      onmouseup={onMouseUp}
      ondblclick={onClick}
    ></canvas>
  </div>
{/if}
```

- [ ] **Step 2: Add GraphView to App.svelte**

```svelte
import GraphView from "$lib/components/GraphView.svelte";

<!-- After QuickSwitcher -->
<GraphView />
```

- [ ] **Step 3: Build and test**

Run: `npm run build && node server/index.js --vault ./test-vault`
Test: Cmd+G opens graph, nodes visible, can pan/zoom, double-click navigates.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/GraphView.svelte src/App.svelte
git commit -m "feat: graph view — force-directed visualization of note connections"
```

---

## Task 12: Dockerfile + Docker Compose + Deployment

**Files:**
- Create: `Dockerfile`
- Modify: `/home/ubuntu/topics/obsidian/docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

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

- [ ] **Step 2: Build Docker image and test**

```bash
docker build -t synapse .
docker run --rm -p 5173:5173 -v $(pwd)/test-vault:/vault synapse
```

Open `http://localhost:5173` — verify full app works.

- [ ] **Step 3: Deploy to production**

```bash
cd /home/ubuntu/topics/obsidian
docker compose up -d --build
```

Verify: `https://synapse.aaroncollins.info` loads behind Authelia SSO.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile
git commit -m "feat: multi-stage Dockerfile for production deployment"
```

---

## Task 13: E2E Tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/navigation.spec.ts`
- Create: `tests/e2e/editor.spec.ts`
- Create: `tests/e2e/backlinks.spec.ts`
- Create: `tests/e2e/tags.spec.ts`
- Create: `tests/e2e/search.spec.ts`

- [ ] **Step 1: Create playwright.config.ts**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node server/index.js --vault ./test-vault --host 0.0.0.0",
    port: 5173,
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 2: Create tests/e2e/navigation.spec.ts**

```typescript
import { test, expect } from "@playwright/test";

test("can open a file from tree", async ({ page }) => {
  await page.goto("/");
  await page.click('text=Welcome');
  await expect(page.locator(".cm-content")).toBeVisible();
});

test("wikilink navigation creates new note", async ({ page }) => {
  await page.goto("/");
  await page.click('text=Welcome');
  await expect(page.locator(".cm-content")).toBeVisible();
});
```

- [ ] **Step 3: Create tests/e2e/editor.spec.ts**

```typescript
import { test, expect } from "@playwright/test";

test("editor shows save status", async ({ page }) => {
  await page.goto("/");
  await page.click('text=Welcome');
  await expect(page.locator("text=Saved")).toBeVisible();
});

test("editing marks as unsaved then auto-saves", async ({ page }) => {
  await page.goto("/");
  await page.click('text=Welcome');
  await page.locator(".cm-content").click();
  await page.keyboard.type("test edit ");
  await expect(page.locator("text=Unsaved")).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(page.locator("text=Saved")).toBeVisible();
});
```

- [ ] **Step 4: Create tests/e2e/search.spec.ts**

```typescript
import { test, expect } from "@playwright/test";

test("quick switcher opens on Ctrl+K", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await expect(page.locator("text=Jump to note")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("text=Jump to note")).not.toBeVisible();
});
```

- [ ] **Step 5: Install Playwright browsers**

Run: `npx playwright install --with-deps chromium`

- [ ] **Step 6: Run e2e tests**

Run: `npm run build && npx playwright test`
Expected: All PASS.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "test: e2e tests — navigation, editor, search, quick switcher"
```

---

## Task 14: README + Final Push

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# Synapse

A web-based knowledge management app for creating and navigating interconnected markdown notes. Features wiki-style linking, backlinks, tags, full-text search, a quick switcher, and an interactive graph view.

## Features

- **Wiki-style links** — `[[Note Name]]` with autocomplete and click-to-navigate
- **Backlinks** — See all notes that link to the current note
- **Tags** — `#tag` syntax with a visual tag cloud and filtering
- **Full-text search** — Search across all note contents
- **Quick switcher** — `Ctrl+K` / `Cmd+K` for instant fuzzy note switching
- **Graph view** — Force-directed visualization of note connections
- **CodeMirror 6 editor** — Syntax highlighting, auto-save, mobile toolbar
- **Responsive** — Works on desktop and mobile with touch gestures
- **Dark/Light themes** — System-aware with manual toggle

## Quick Start

```bash
npm install
npm run build
node server/index.js --vault /path/to/your/notes
```

Open `http://localhost:5173`

## Development

```bash
npm run dev        # Vite dev server (port 5174, proxies API)
npm run dev:server # API server (port 5173)
npm test           # Unit tests
npm run test:e2e   # E2E tests
```

## Docker

```bash
docker build -t synapse .
docker run -p 5173:5173 -v /path/to/notes:/vault synapse
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick switcher |
| `Ctrl/Cmd + S` | Save |
| `Ctrl/Cmd + G` | Graph view |
| `Ctrl/Cmd + \` | Toggle sidebar |
| `Ctrl/Cmd + .` | Toggle backlinks |
| `Ctrl/Cmd + Shift + F` | Search |

## Tech Stack

Svelte 5 · Vite · Tailwind CSS · CodeMirror 6 · d3-force · Node.js

## License

MIT
```

- [ ] **Step 2: Create LICENSE**

```
MIT License

Copyright (c) 2026 Aaron Collins

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Final push**

```bash
git add README.md LICENSE
git commit -m "docs: README, LICENSE, project documentation"
git push origin main
```

- [ ] **Step 4: Deploy to production**

```bash
cd /home/ubuntu/topics/obsidian
docker compose up -d --build
```

Verify `https://synapse.aaroncollins.info` is live.
