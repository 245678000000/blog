import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List, X } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// 共享的 hook 用于获取标题
function useHeadings(content: string) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // 滚动监听，高亮当前章节
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    const updateHeadings = () => {
      // 从页面中提取所有标题
      const elements = Array.from(
        document.querySelectorAll(
          ".markdown-content h1, .markdown-content h2, .markdown-content h3"
        )
      );

      // ID 一律由 Markdown 渲染阶段（rehype-slug + rehypeHeadingIds）生成，
      // 目录只负责读取。此前这里对无 ID 的标题补随机 ID，会导致同一篇文章
      // 每次渲染的锚点都不一样：链接复制出去就失效，预渲染产物也对不上。
      // 没有 ID 的标题（例如原始 HTML 里手写的 <h2>）直接跳过，不再伪造。
      const withIds = elements.filter(elem => elem.id);

      const items: TocItem[] = withIds.map(elem => ({
        id: elem.id,
        text: elem.textContent || "",
        level: parseInt(elem.tagName.substring(1)),
      }));

      setHeadings(items);

      // 重新绑定滚动高亮监听
      observer.disconnect();
      withIds.forEach(elem => observer.observe(elem));
    };

    // 初次提取
    updateHeadings();

    // 监听 DOM 树的变化（防范异步加载/分批渲染）
    const mutationObserver = new MutationObserver(() => {
      updateHeadings();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [content]);

  return { headings, activeId };
}

// 滚动到指定标题
function scrollToHeading(id: string) {
  const element = document.getElementById(id);
  if (element) {
    const offset = 100; // header height
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
}

// 桌面端目录 (侧边栏)
export function TableOfContents({ content }: { content: string }) {
  const { headings, activeId } = useHeadings(content);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="hidden xl:block fixed right-8 top-1/2 -translate-y-1/2 w-64 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="sticky top-24">
        <h4 className="text-sm font-mono text-muted-foreground mb-4 uppercase tracking-wider">
          目录
        </h4>
        <ul className="space-y-2 text-sm">
          {/* 目录项必须是 <a href="#id"> 而不是带 onClick 的 <li>：
              后者键盘完全够不着（不可聚焦、回车无反应），读屏软件也只会把它
              读成一段普通文本，不知道能点。preventDefault 是为了保留带 offset
              的平滑滚动，语义和键盘可达性由 <a> 提供。 */}
          {headings.map(heading => (
            <li
              key={heading.id}
              className={cn(
                heading.level === 2 && "pl-0",
                heading.level === 3 && "pl-4"
              )}
            >
              <a
                href={`#${heading.id}`}
                onClick={e => {
                  e.preventDefault();
                  scrollToHeading(heading.id);
                }}
                aria-current={activeId === heading.id ? "true" : undefined}
                className={cn(
                  "block transition-colors hover:text-primary rounded-sm",
                  heading.level === 1 && "font-semibold",
                  activeId === heading.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// 移动端目录 (可折叠抽屉)
export function MobileTableOfContents({ content }: { content: string }) {
  const { headings, activeId } = useHeadings(content);
  const [isOpen, setIsOpen] = useState(false);

  // 遮住整个视口的抽屉必须能用 Esc 关掉，否则键盘用户只能一路 Tab 去找关闭按钮
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      {/* 触发按钮 - 只在移动端显示 */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "xl:hidden fixed bottom-8 left-8 z-40 p-3 rounded-full bg-secondary text-secondary-foreground shadow-lg transition-all duration-300 hover:bg-secondary/80 hover:scale-110",
          "flex items-center justify-center"
        )}
        aria-label="打开目录"
      >
        <List className="h-5 w-5" />
      </button>

      {/* 抽屉背景。用 <button> 而不是带 onClick 的 <div>：
          「点空白处关闭」对键盘用户来说等于不存在，而且读屏软件不会告诉他
          这里能点。做成按钮就自带聚焦与回车。 */}
      {isOpen && (
        <button
          type="button"
          aria-label="关闭目录"
          className="xl:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 抽屉内容 */}
      <div
        className={cn(
          "xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out max-h-[70vh] overflow-hidden",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        // 关着的时候是 translate 到屏幕外而不是卸载，不设 inert 的话
        // Tab 会走进一堆看不见的链接里
        inert={!isOpen}
      >
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h4 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            目录
          </h4>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="关闭目录"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 目录列表 */}
        <nav className="overflow-y-auto max-h-[calc(70vh-60px)] p-4">
          <ul className="space-y-3">
            {headings.map(heading => (
              <li
                key={heading.id}
                className={cn(
                  heading.level === 2 && "pl-0",
                  heading.level === 3 && "pl-4"
                )}
              >
                <a
                  href={`#${heading.id}`}
                  onClick={e => {
                    e.preventDefault();
                    scrollToHeading(heading.id);
                    setIsOpen(false);
                  }}
                  aria-current={activeId === heading.id ? "true" : undefined}
                  className={cn(
                    "block transition-colors hover:text-primary py-1 rounded-sm",
                    heading.level === 1 ? "font-semibold text-base" : "text-sm",
                    activeId === heading.id
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

// 回到顶部按钮
export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-8 right-8 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 hover:scale-110",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10 pointer-events-none"
      )}
      aria-label="回到顶部"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
