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
