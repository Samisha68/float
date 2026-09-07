import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    proxy: { "/api": "http://127.0.0.1:3001" },
    watch: { ignored: ["**/data/**", "**/server/**"] },
  },
  plugins: [react(), tailwindcss()],
  define: { "process.env": {}, global: "globalThis" },
  resolve: { alias: { buffer: "buffer/" } },
});
