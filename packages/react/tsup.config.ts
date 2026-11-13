import { defineConfig } from "tsup";
import pkg from "./package.json";

const license = `/**
 * @license ${pkg.name} v${pkg.version} - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 * https://uiuxicons.com
 */`;

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
  banner: { js: `"use client";\n${license}` },
});
