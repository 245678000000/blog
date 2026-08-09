import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useInView } from "@/hooks/useInView";

/**
 * Giscus 评论组件
 */
// 固定配置，与渲染无关。放在模块作用域而不是组件内部有两个好处：
// 不再每次渲染重建对象，且它不再是 React 眼中的「响应式值」，
// useEffect 的依赖数组可以如实只写 [theme]，无需 eslint-disable，
// exhaustive-deps 以后仍能抓出真正的依赖遗漏。
// README 里记的 VITE_GISCUS_* 此前是死的——配置写死在这里，环境变量没人读。
// 现在以环境变量优先，本站现有配置作为兜底，两者行为一致。
const giscusConfig = {
  repo: import.meta.env.VITE_GISCUS_REPO || "245678000000/blog",
  repoId: import.meta.env.VITE_GISCUS_REPO_ID || "R_kgDOQ4_tIg",
  category: import.meta.env.VITE_GISCUS_CATEGORY || "Announcements",
  categoryId: import.meta.env.VITE_GISCUS_CATEGORY_ID || "DIC_kwDOQ4_tIs4C0573",
};

// 主题 → giscus 主题名。两处（首次注入、后续切换）必须用同一个映射，
// 否则切一次主题评论区的配色就和站点对不上了。
function giscusTheme(theme: string) {
  return theme === "dark" ? "dark_dimmed" : "light";
}

export function Comments() {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  // 评论区在文章最底部，绝大多数读者滚不到这里。
  // 之前一进文章页就注入 giscus 的 script + iframe，等于每篇文章都无条件
  // 付一次第三方请求的代价。改成进入视口前后 200px 才开始加载。
  const [inViewRef, isInView] = useInView<HTMLDivElement>({
    rootMargin: "200px",
  });

  // theme 只能通过 ref 读：这个 effect 依赖数组里不能有 theme。
  // 它一旦因 theme 变化重跑，就会把整个评论区拆掉重新注入——
  // 评论列表闪白重载，用户正在写的草稿也没了。主题切换交给下面那个 effect
  // 用 postMessage 处理，那才是 giscus 官方的热更新通道。
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    if (!isInView) return;
    const container = containerRef.current;
    if (!container) return;

    // 创建 giscus script
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", giscusConfig.repo);
    script.setAttribute("data-repo-id", giscusConfig.repoId);
    script.setAttribute("data-category", giscusConfig.category);
    script.setAttribute("data-category-id", giscusConfig.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", giscusTheme(themeRef.current));
    script.setAttribute("data-lang", "zh-CN");
    script.crossOrigin = "anonymous";
    script.async = true;

    container.appendChild(script);

    // 切换文章时组件会重新挂载，把上一篇的 widget 和 iframe 一起带走
    return () => {
      container.querySelector(".giscus")?.remove();
      container.querySelector(".giscus-frame")?.remove();
      script.remove();
    };
  }, [isInView]);

  // 主题切换时更新 giscus 主题（iframe 还没建出来就什么都不用做）
  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>(".giscus-frame");
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: giscusTheme(theme) } } },
      "https://giscus.app"
    );
  }, [theme]);

  return (
    <div className="mt-12 w-full min-w-0 border-t border-border/50 pt-8">
      <h3 className="text-lg font-serif font-bold mb-4">评论</h3>
      <div
        ref={node => {
          containerRef.current = node;
          inViewRef(node);
        }}
        className="giscus-container min-h-[200px] w-full min-w-0"
      />
    </div>
  );
}
