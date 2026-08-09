import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";

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
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 无障碍规则按 error 收：这类问题不会报错也不会白屏，
      // 只是键盘和读屏用户用不了，人工 review 根本注意不到。
      // 装上它当场就抓出了 Markdown 里那个只能用鼠标点开的图片 Lightbox。
      ...jsxA11y.flatConfigs.recommended.rules,
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
