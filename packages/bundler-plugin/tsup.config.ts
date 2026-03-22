import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/core/index.ts",
    "src/vite/index.ts",
    "src/webpack/index.ts",
    "src/webpack/loader.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
});
