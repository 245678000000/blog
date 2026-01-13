import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List, X } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// 共享的 hook 用于获取标题
function useHeadings() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // 从页面中提取所有标题
    const elements = Array.from(
      document.querySelectorAll(".markdown-content h1, .markdown-content h2, .markdown-content h3")
    );

    const items: TocItem[] = elements.map((elem) => ({
      id: elem.id || `heading-${Math.random().toString(36).substr(2, 9)}`,
      text: elem.textContent || "",
      level: parseInt(elem.tagName.substring(1)),
    }));

    // 为没有 ID 的标题添加 ID
    elements.forEach((elem, index) => {
      if (!elem.id) {
        elem.id = items[index].id;
      }
    });

    setHeadings(items);

    // 滚动监听，高亮当前章节
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    elements.forEach((elem) => observer.observe(elem));

    return () => observer.disconnect();
  }, []);

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
export function TableOfContents() {
  const { headings, activeId } = useHeadings();

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
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={cn(
                "cursor-pointer transition-colors hover:text-primary",
                heading.level === 1 && "font-semibold",
                heading.level === 2 && "pl-0",
                heading.level === 3 && "pl-4",
                activeId === heading.id ? "text-primary font-medium" : "text-muted-foreground"
              )}
              onClick={() => scrollToHeading(heading.id)}
            >
              {heading.text}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// 移动端目录 (可折叠抽屉)
export function MobileTableOfContents() {
  const { headings, activeId } = useHeadings();
  const [isOpen, setIsOpen] = useState(false);

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

      {/* 抽屉背景 */}
      {isOpen && (
        <div
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
            {headings.map((heading) => (
              <li
                key={heading.id}
                className={cn(
                  "cursor-pointer transition-colors hover:text-primary py-1",
                  heading.level === 1 && "font-semibold text-base",
                  heading.level === 2 && "pl-0 text-sm",
                  heading.level === 3 && "pl-4 text-sm",
                  activeId === heading.id ? "text-primary font-medium" : "text-muted-foreground"
                )}
                onClick={() => {
                  scrollToHeading(heading.id);
                  setIsOpen(false);
                }}
              >
                {heading.text}
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
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
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
