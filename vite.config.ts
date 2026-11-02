import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Teste local: com VITE_API_URL=/api-dev, as chamadas passam pelo proprio Vite ate
    // a API em localhost:3000 (mesma origem, sem CORS). Nao afeta o build de producao.
    proxy: {
      "/api-dev": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/api-dev/, ""),
      },
    },
  },
});
