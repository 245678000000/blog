import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { lazy, Suspense, useState, useEffect, useCallback } from "react";

// 懒加载代码高亮组件，减少首屏体积
const SyntaxHighlighter = lazy(() =>
  import("react-syntax-highlighter/dist/esm/prism-async-light").then(mod => ({
    default: mod.default,
  }))
) as any;

// 懒加载主题
const loadTheme = () =>
  import("react-syntax-highlighter/dist/esm/styles/prism").then(
    mod => mod.oneDark
  );

// 代码高亮组件
function CodeHighlighter({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [theme, setTheme] = useState<Record<
    string,
    React.CSSProperties
  > | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTheme().then(setTheme);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const fallback = (
    <pre className="rounded-lg rounded-t-none bg-[#282c34] p-4 overflow-x-auto">
      <code className="text-sm font-mono text-gray-300">{children}</code>
    </pre>
  );

  return (
    <div className="rounded-lg overflow-hidden my-4 border border-border/30">
      {/* 工具栏 */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#21252b] text-xs text-gray-400">
        <span className="font-mono uppercase tracking-wide">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-gray-200 transition-colors"
        >
          {copied ? (
            <span className="text-green-400">✓ 已复制</span>
          ) : (
            <span>复制</span>
          )}
        </button>
      </div>
      {/* 代码内容 */}
      {!theme ? (
        fallback
      ) : (
        <Suspense fallback={fallback}>
          <SyntaxHighlighter
            style={theme}
            language={language}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: 0 }}
          >
            {children}
          </SyntaxHighlighter>
        </Suspense>
      )}
    </div>
  );
}

// 图片 Lightbox 组件
function ImageLightbox({ src, alt }: { src?: string; alt?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className="rounded-lg my-4 max-w-full h-auto cursor-zoom-in transition-opacity hover:opacity-90"
        loading="lazy"
        decoding="async"
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none"
            onClick={handleClose}
            aria-label="关闭"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}

// 从标题文本生成 slug ID（兼容中文）
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留中文、英文、数字、空格、连字符
    .replace(/\s+/g, '-')                    // 空格转连字符
    .replace(/-+/g, '-')                     // 合并多个连字符
    .replace(/^-|-$/g, '');                   // 去除首尾连字符
}

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = "" }: MarkdownProps) {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        script: () => null,
        // 代码块高亮 (懒加载)
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match?.[1] || "";
          const codeContent = String(children).replace(/\n$/, "");
          const isInline = !className || !className.includes("language-");

          return !isInline && language ? (
            <CodeHighlighter language={language}>{codeContent}</CodeHighlighter>
          ) : (
            <code
              className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        // 标题（自动生成 id 供目录跳转）
        h1: ({ children }) => {
          const text = String(children);
          return (
            <h1 id={generateHeadingId(text)} className="text-3xl md:text-4xl font-serif font-bold mt-8 mb-4 text-foreground scroll-mt-24">
              {children}
            </h1>
          );
        },
        h2: ({ children }) => {
          const text = String(children);
          return (
            <h2 id={generateHeadingId(text)} className="text-2xl md:text-3xl font-serif font-bold mt-8 mb-4 text-foreground scroll-mt-24">
              {children}
            </h2>
          );
        },
        h3: ({ children }) => {
          const text = String(children);
          return (
            <h3 id={generateHeadingId(text)} className="text-xl md:text-2xl font-serif font-semibold mt-6 mb-3 text-foreground scroll-mt-24">
              {children}
            </h3>
          );
        },
        h4: ({ children }) => {
          const text = String(children);
          return (
            <h4 id={generateHeadingId(text)} className="text-lg md:text-xl font-serif font-semibold mt-4 mb-2 text-foreground scroll-mt-24">
              {children}
            </h4>
          );
        },
        // 段落
        p: ({ children }) => (
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground mb-4">
            {children}
          </p>
        ),
        // 列表
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 text-muted-foreground space-y-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 text-muted-foreground space-y-2">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-base leading-relaxed">{children}</li>
        ),
        // 链接
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary hover:underline transition-colors"
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        ),
        // 引用块
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-4 italic text-muted-foreground bg-secondary/30 rounded-r">
            {children}
          </blockquote>
        ),
        // 分隔线
        hr: () => <hr className="border-border/50 my-8" />,
        // 表格
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-border/50 rounded-lg overflow-hidden">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-secondary/50">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border/50">{children}</tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm text-muted-foreground">
            {children}
          </td>
        ),
        // 图片 (优化加载 + 点击放大)
        img: ({ src, alt }) => (
          <ImageLightbox src={src} alt={alt} />
        ),
        // 强调
        strong: ({ children }) => (
          <strong className="font-semibold text-primary">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
