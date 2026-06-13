import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  bundle: false,
  clean: true,
  external: ["react"],
  jsx: "automatic",
  // Icon components rely on React's use() hook, which is client-only.
  // The directive makes them work out of the box in Next.js App Router.
  banner: { js: '"use client";' },
});
