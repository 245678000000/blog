import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * 网站分析组件
 *
 * 支持多种分析服务:
 * - Umami (开源自托管)
 * - Plausible (隐私友好)
 * - Google Analytics
 *
 * 配置环境变量:
 * - VITE_ANALYTICS_PROVIDER: 'umami' | 'plausible' | 'google' | ''
 * - VITE_UMAMI_WEBSITE_ID: Umami 网站 ID
 * - VITE_UMAMI_SRC: Umami 脚本地址 (默认: https://cloud.umami.is/script.js)
 * - VITE_PLAUSIBLE_DOMAIN: Plausible 域名
 * - VITE_PLAUSIBLE_SRC: Plausible 脚本地址 (默认: https://plausible.io/js/script.js)
 * - VITE_GA_ID: Google Analytics 测量 ID (G-XXXXXXX)
 */
// 这些值来自 import.meta.env，由 Vite 在构建时静态替换，运行期不会变化。
// 放在模块作用域而不是组件内部，它们就不再是 React 眼中的「响应式值」，
// useEffect 的依赖数组可以如实写成 []，既不需要 eslint-disable，
// 也保证了 exhaustive-deps 以后仍能抓出真正的依赖遗漏。
const provider = import.meta.env.VITE_ANALYTICS_PROVIDER || "";

// Umami 配置
const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID || "";
const umamiSrc =
  import.meta.env.VITE_UMAMI_SRC || "https://cloud.umami.is/script.js";

// Plausible 配置
const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN || "";
const plausibleSrc =
  import.meta.env.VITE_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";

// Google Analytics 配置
const gaId = import.meta.env.VITE_GA_ID || "";

// 加载 Umami
function loadUmami() {
  if (document.querySelector("script[data-website-id]")) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = umamiSrc;
  script.setAttribute("data-website-id", umamiWebsiteId);
  document.head.appendChild(script);
}

// 加载 Plausible
function loadPlausible() {
  if (document.querySelector("script[data-domain]")) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = plausibleSrc;
  script.setAttribute("data-domain", plausibleDomain);
  document.head.appendChild(script);
}

// 加载 Google Analytics
function loadGoogleAnalytics() {
  if (document.querySelector('script[src*="googletagmanager"]')) return;

  // 加载 gtag.js
  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script1);

  // 初始化 gtag
  const script2 = document.createElement("script");
  script2.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
  document.head.appendChild(script2);
}

export function Analytics() {
  const [location] = useLocation();

  useEffect(() => {
    // 分析脚本只在挂载时加载一次
    if (provider === "umami" && umamiWebsiteId) {
      loadUmami();
    } else if (provider === "plausible" && plausibleDomain) {
      loadPlausible();
    } else if (provider === "google" && gaId) {
      loadGoogleAnalytics();
    }
  }, []);

  // 页面切换时发送页面浏览事件
  useEffect(() => {
    if (provider === "google" && gaId && window.gtag) {
      window.gtag("event", "page_view", {
        page_path: location,
      });
    }
    // Umami 和 Plausible 会自动追踪 SPA 页面切换
  }, [location]);

  return null; // 这个组件不渲染任何内容
}

// 扩展 Window 类型以支持 gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}
