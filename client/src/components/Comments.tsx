import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Giscus 评论组件
 */
export function Comments() {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // 硬编码 Giscus 配置 - 确保评论能工作
  const giscusConfig = {
    repo: "245678000000/blog",
    repoId: "R_kgDOQ4_tIg",
    category: "Announcements",
    categoryId: "DIC_kwDOQ4_tIs4C0573",
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // 清除现有的 giscus
    const existingIframe = containerRef.current.querySelector(".giscus-frame");
    if (existingIframe) {
      existingIframe.remove();
    }
    const existingWidget = containerRef.current.querySelector(".giscus");
    if (existingWidget) {
      existingWidget.remove();
    }

    // 创建新的 giscus script
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
    script.setAttribute("data-theme", theme === "dark" ? "dark_dimmed" : "light");
    script.setAttribute("data-lang", "zh-CN");
    script.crossOrigin = "anonymous";
    script.async = true;

    containerRef.current.appendChild(script);
  }, [theme]);

  // 主题切换时更新 giscus 主题
  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>(".giscus-frame");
    if (iframe) {
      iframe.contentWindow?.postMessage(
        {
          giscus: {
            setConfig: {
              theme: theme === "dark" ? "dark_dimmed" : "light",
            },
          },
        },
        "https://giscus.app"
      );
    }
  }, [theme]);

  return (
    <div className="mt-12 pt-8 border-t border-border/50">
      <h3 className="text-lg font-serif font-bold mb-4">评论</h3>
      <div ref={containerRef} className="giscus-container min-h-[200px]" />
    </div>
  );
}
