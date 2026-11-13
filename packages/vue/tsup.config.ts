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
  entry: ["src/**/*.ts"],
  format: ["esm", "cjs"],
  dts: true,
  bundle: false,
  clean: true,
  external: ["vue"],
  banner: { js: license },
});
