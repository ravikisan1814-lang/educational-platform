import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // The default "threads" pool crashes on this machine with
    // "Cannot read properties of undefined (reading 'config')".
    // vmThreads runs the same tests reliably.
    pool: "vmThreads",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});