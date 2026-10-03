import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// GitHub Pages serves this project at /laravel-perf-audit-marketplace/.
// `base` must match the repo name for assets to resolve.
export default defineConfig({
  base: "/laravel-perf-audit-marketplace/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Build straight into the repo's docs/ folder so GitHub Pages can serve
  // from the `main` branch /docs source with no Action required.
  build: {
    outDir: path.resolve(__dirname, "../docs"),
    emptyOutDir: true,
  },
})
