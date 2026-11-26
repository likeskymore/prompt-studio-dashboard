import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: [
      "src/tests/serviceTest/**/*.test.ts",
      "src/tests/pageTest/**/*.test.tsx",
      "src/tests/routeTest/**/*.test.ts",
    ],
    setupFiles: ["./src/tests/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
