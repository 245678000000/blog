import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Giscus 评论组件
 *
 * 使用前需要配置以下环境变量:
 * - VITE_GISCUS_REPO: GitHub 仓库名称 (格式: username/repo)
 * - VITE_GISCUS_REPO_ID: 仓库 ID
 * - VITE_GISCUS_CATEGORY: Discussions 分类名称
 * - VITE_GISCUS_CATEGORY_ID: 分类 ID
 *
 * 获取这些值: https://giscus.app/
 */
export function Comments() {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Giscus 配置
  const giscusRepo = import.meta.env.VITE_GISCUS_REPO || "";
  const giscusRepoId = import.meta.env.VITE_GISCUS_REPO_ID || "";
  const giscusCategory = import.meta.env.VITE_GISCUS_CATEGORY || "General";
  const giscusCategoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID || "";

  // 检查是否配置了必要的环境变量
  const isConfigured = giscusRepo && giscusRepoId && giscusCategoryId;

  useEffect(() => {
    if (!isConfigured || !containerRef.current) return;

    // 清除现有的 giscus iframe
    const existingScript = containerRef.current.querySelector("script.giscus");
    if (existingScript) {
      existingScript.remove();
    }
    const existingWidget = containerRef.current.querySelector(".giscus");
    if (existingWidget) {
      existingWidget.remove();
    }

    // 创建新的 giscus script
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", giscusRepo);
    script.setAttribute("data-repo-id", giscusRepoId);
    script.setAttribute("data-category", giscusCategory);
    script.setAttribute("data-category-id", giscusCategoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", theme === "dark" ? "dark_dimmed" : "light");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");
    script.crossOrigin = "anonymous";
    script.async = true;
    script.className = "giscus";

    containerRef.current.appendChild(script);

    return () => {
      // 清理
      if (containerRef.current) {
        const scriptToRemove = containerRef.current.querySelector("script.giscus");
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      }
    };
  }, [theme, isConfigured, giscusRepo, giscusRepoId, giscusCategory, giscusCategoryId]);

  // 主题切换时更新 giscus 主题
  useEffect(() => {
    if (!isConfigured) return;

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
  }, [theme, isConfigured]);

  if (!isConfigured) {
    return (
      <div className="mt-12 pt-8 border-t border-border/50">
        <h3 className="text-lg font-serif font-bold mb-4">评论</h3>
        <div className="rounded-lg bg-secondary/30 p-6 text-center">
          <p className="text-muted-foreground text-sm">
            评论功能尚未配置。
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            请在环境变量中配置 Giscus 相关参数。
            <a
              href="https://giscus.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1"
            >
              了解更多
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t border-border/50">
      <h3 className="text-lg font-serif font-bold mb-4">评论</h3>
      <div ref={containerRef} className="giscus-container" />
    </div>
  );
}
