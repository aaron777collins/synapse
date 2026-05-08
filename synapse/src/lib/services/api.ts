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

export interface TagNoteParagraph {
  content: string;
  lineNumber: number;
  tagLineNumber: number;
  heading: string | null;
}

export interface TagNoteSection {
  filePath: string;
  paragraphs: TagNoteParagraph[];
}

export interface TagNoteData {
  tag: string;
  fileCount: number;
  paragraphCount: number;
  sections: TagNoteSection[];
}

export interface TagSearchResult {
  path: string;
  matchedTags: string[];
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
    note: (tag: string) => request<TagNoteData>(`/api/tags/note?tag=${encodeURIComponent(tag)}`),
    search: (tags: string[], mode: "and" | "or" = "and") =>
      request<TagSearchResult[]>(`/api/tags/search?tags=${encodeURIComponent(tags.join(","))}&mode=${mode}`),
  },
};
