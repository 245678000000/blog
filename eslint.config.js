import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "client/public/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },

  // 前端源码
  {
    files: ["client/src/**/*.{ts,tsx}", "shared/**/*.{ts,js}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      // 组件里未使用的变量按下划线前缀豁免
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 少量第三方类型缺口仍需 any，降级为警告而非阻断
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // 构建脚本（Node 环境）
  {
    files: ["scripts/**/*.js", "*.config.{ts,js}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
  },

  // Service Worker
  {
    files: ["client/public/sw.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.serviceworker, ...globals.browser },
    },
  },

  // 测试
  {
    files: ["tests/**/*.{ts,tsx}", "e2e/**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }
);
