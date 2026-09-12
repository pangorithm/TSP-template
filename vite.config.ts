/// <reference types="vitest" />
import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

const { TAURI_DEV_HOST: host, TAURI_ENV_DEBUG: debug, TAURI_ENV_PLATFORM: platform } = process.env;

export default defineConfig({
  plugins: [solidPlugin({ hot: process.env["VITEST"] !== "true" })],
  server: {
    host: host || false,
    port: 1420,
    strictPort: true,
    ...(host === undefined
      ? {}
      : {
          hmr: {
            protocol: "ws" as const,
            host,
            port: 1421,
          },
        }),
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  // Prevent Vite from obscuring Rust errors
  clearScreen: false,
  // Tauri expects a fixed port, fails if unavailable
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: platform === "windows" ? "chrome105" : "safari13",
    minify: debug === undefined,
    sourcemap: debug !== undefined,
  },
  test: {
    environment: "happy-dom",
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
});
