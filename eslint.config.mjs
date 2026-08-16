import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // honeycharge_app(별도 브랜치)의 정적 빌드 산출물 — 압축된 번들이라
    // 소스로 린트할 대상이 아닙니다.
    "public/app/**",
  ]),
]);

export default eslintConfig;
