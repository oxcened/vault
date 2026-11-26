import { configDefaults, defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      "**/*.integration.test.ts",
      "tests/e2e/**",
    ],
  },
  resolve: { alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) } },
});
