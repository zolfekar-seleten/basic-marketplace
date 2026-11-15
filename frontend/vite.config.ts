import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";

const srcDirectory = fileURLToPath(new URL("./src", import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const backendTarget = environment.VITE_API_URL?.trim() || "http://localhost:3000";

  return {
    plugins: [
      react(),
      svgr(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    resolve: {
      alias: [{ find: /^@\//, replacement: `${srcDirectory}/` }],
    },
    server: {
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
