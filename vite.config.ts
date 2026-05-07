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
