import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api and /ws to the Spring Boot backend during development so the
// frontend can use same-origin relative URLs.
export default defineConfig({
  plugins: [react()],
  define: {
    global: "window",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/ws": { target: "http://localhost:8080", changeOrigin: true, ws: true },
    },
  },
});
