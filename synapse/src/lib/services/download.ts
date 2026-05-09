export function downloadFile(path: string) {
  const url = `/api/files/download?path=${encodeURIComponent(path)}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = path.split("/").pop() || "download";
  a.click();
}

export function downloadFolder(path: string) {
  const url = `/api/files/download-zip?path=${encodeURIComponent(path)}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `${path.split("/").pop() || "vault"}.zip`;
  a.click();
}
