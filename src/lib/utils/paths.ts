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
