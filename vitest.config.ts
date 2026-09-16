import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    exclude: [
      "tests/e2e/**",
      ".worktrees/**",
      "**/node_modules/**",
      "**/dist/**",
      "test-results/**",
    ],
  },
});
