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

// Sidebar width persists for the session; clamped between 200–500px in the resize handle
export const sidebarWidth = writable(280);

export const helpOpen = writable(false);
