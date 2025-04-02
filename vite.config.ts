import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    port: parseInt(process.env.VITE_PORT || "5173"),
    host: process.env.VITE_HOST || "localhost",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
