/**
 * CSP 与内联脚本的一致性校验。
 *
 * `vercel.json` 的 script-src 不带 'unsafe-inline'，靠的是写死 index.html 里
 * 内联脚本的 sha256。这套东西**失败起来是静默的**：哈希对不上，浏览器直接拦掉
 * 那段脚本，页面照常渲染，只是主题闪烁回来了、Service Worker 不再注册——
 * 本地怎么点都发现不了，因为 dev 服务器不发 CSP。
 *
 * 所以这里既在构建期跑（校验真正发出去的 dist 产物），也被 tests/f17 复用
 * （校验源文件，改完立刻红）。
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 带 src 的是外链脚本（走 'self'），application/ld+json 是数据块不会被执行，
// 两者都不需要哈希。实测过：严格 script-src 不会拦 ld+json。
const INLINE_SCRIPT_RE =
  /<script(?![^>]*\bsrc=)(?![^>]*\btype="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g;

/** 取出 HTML 里所有需要哈希的内联脚本，返回 `sha256-xxx` 数组 */
export function collectInlineScriptHashes(html) {
  return [...html.matchAll(INLINE_SCRIPT_RE)].map(
    m =>
      `sha256-${crypto.createHash("sha256").update(m[1], "utf-8").digest("base64")}`
  );
}

/** 从 CSP 字符串里取出某个指令的取值列表 */
export function getCspDirective(csp, directive) {
  const found = csp
    .split(";")
    .map(part => part.trim())
    .find(part => part === directive || part.startsWith(`${directive} `));
  return found ? found.split(/\s+/).slice(1) : [];
}

/** 从 vercel.json 里取出 CSP 字符串 */
export function extractCsp(vercelConfig) {
  for (const rule of vercelConfig.headers || []) {
    for (const header of rule.headers || []) {
      if (header.key.toLowerCase() === "content-security-policy") {
        return header.value;
      }
    }
  }
  return null;
}

/**
 * 返回错误信息数组（为空表示通过）。
 * @param {string} html          要校验的 HTML
 * @param {object} vercelConfig  解析后的 vercel.json
 * @param {string} htmlLabel     报错时显示的文件名
 */
export function checkCsp(html, vercelConfig, htmlLabel) {
  const errors = [];
  const csp = extractCsp(vercelConfig);

  if (!csp) {
    return ["vercel.json 里找不到 Content-Security-Policy 头"];
  }

  const scriptSrc = getCspDirective(csp, "script-src");

  if (scriptSrc.includes("'unsafe-inline'")) {
    errors.push(
      "script-src 里出现了 'unsafe-inline'。它会让下面所有的 sha256 白名单失效" +
        "（浏览器见到 'unsafe-inline' 就放行一切内联脚本），等于把这道防线关掉。"
    );
  }

  const actual = collectInlineScriptHashes(html);
  const missing = actual.filter(hash => !scriptSrc.includes(`'${hash}'`));

  if (missing.length > 0) {
    errors.push(
      `${htmlLabel} 里有内联脚本的哈希不在 CSP 的 script-src 中：\n` +
        missing.map(h => `  '${h}'`).join("\n") +
        `\n\n改过 ${htmlLabel} 的内联脚本就要同步更新 vercel.json 的 script-src。` +
        `\n不更新的话线上那段脚本会被静默拦掉：主题闪烁回来、Service Worker 不再注册。`
    );
  }

  // 反向检查：CSP 里留着已经用不到的哈希，说明改代码时只加不删，
  // 时间一长没人知道哪个哈希对应哪段脚本
  const stale = scriptSrc
    .filter(token => token.startsWith("'sha256-"))
    .map(token => token.slice(1, -1))
    .filter(hash => !actual.includes(hash));

  if (stale.length > 0) {
    errors.push(
      `CSP 的 script-src 里有已经对不上任何内联脚本的哈希（应删除）：\n` +
        stale.map(h => `  '${h}'`).join("\n")
    );
  }

  return errors;
}

// 作为脚本直接运行时，校验构建产物
if (process.argv[1] === __filename) {
  const distIndex = path.join(__dirname, "../dist/public/index.html");
  const vercelPath = path.join(__dirname, "../vercel.json");

  if (!fs.existsSync(distIndex)) {
    console.error("❌ 找不到 dist/public/index.html，请先 vite build");
    process.exit(1);
  }

  const errors = checkCsp(
    fs.readFileSync(distIndex, "utf-8"),
    JSON.parse(fs.readFileSync(vercelPath, "utf-8")),
    "dist/public/index.html"
  );

  if (errors.length > 0) {
    console.error(`❌ CSP 校验未通过：\n\n${errors.join("\n\n")}`);
    process.exit(1);
  }

  console.log("✅ CSP inline-script hashes match");
}
