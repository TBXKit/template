import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Playwright specs under test/e2e/ are *.spec.ts, which Vitest's default
    // glob would otherwise pick up and fail on. They run via `npm run test:e2e`.
    exclude: [...configDefaults.exclude, "test/e2e/**"],
  },
});
