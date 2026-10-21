import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Vendored Three.js is maintained upstream, not as application source.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "assets/bazi/04_modelo_3d/iteraciones/v005/vendor/**",
  ]),
  {
    // These standalone asset validators deliberately run as Node CommonJS.
    files: ["assets/bazi/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);
