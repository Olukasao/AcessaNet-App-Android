import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const here = path.dirname(fileURLToPath(import.meta.url));
// O código da Central (telas, API, CSS) é reaproveitado do site, sem cópia.
const siteRoot = path.resolve(here, "../acessanet-lab");

// Política de segurança de conteúdo do app (só no build; o dev server precisa de scripts inline do HMR).
// connect-src: apenas a API da AcessaNet. img-src aceita https: porque avisos podem trazer imagem.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://acessanet.com.br",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

const cspPlugin = {
  name: "acessanet-csp",
  apply: "build",
  transformIndexHtml: (html) => html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`)
};

export default defineConfig({
  root: here,
  base: "./",
  plugins: [react(), cspPlugin],
  resolve: {
    alias: [
      { find: "@site", replacement: path.join(siteRoot, "src") },
      // uma única cópia de react/router/fontes: a do site
      ...["react", "react-dom", "react-router-dom", "@fontsource-variable/sora", "@fontsource-variable/manrope", "lucide-react"].map((name) => ({
        find: new RegExp(`^${name}(/|$)`),
        replacement: path.join(siteRoot, "node_modules", name) + "$1"
      }))
    ]
  },
  server: { fs: { allow: [here, siteRoot] } },
  define: {
    "import.meta.env.VITE_ACESSANET_API_URL": JSON.stringify(process.env.VITE_ACESSANET_API_URL || "https://acessanet.com.br")
  },
  build: { target: "es2020", outDir: "dist", emptyOutDir: true }
});
