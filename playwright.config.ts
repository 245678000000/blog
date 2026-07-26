import { defineConfig } from "@playwright/test";

// e2e 用独立端口，避开 3000（开发服务器常用，也容易被别的项目占着）。
// reuseExistingServer: false + --strictPort：端口被占时直接失败，
// 而不是悄悄连上别人的服务去跑测试——那样既会误报失败，也可能误报通过。
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  // Vite dev server 是按需编译的，首次访问某个路由要现场转译整条依赖链，
  // 默认 5s 的断言超时不够，会让首个用例稳定地「首跑失败、重试通过」。
  expect: { timeout: 15000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
