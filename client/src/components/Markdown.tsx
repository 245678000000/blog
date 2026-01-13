import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { lazy, Suspense } from "react";

// 懒加载代码高亮组件，减少首屏体积
const SyntaxHighlighter = lazy(() =>
  import("react-syntax-highlighter/dist/esm/prism-async-light").then((mod) => ({
    default: mod.default,
  }))
);

// 懒加载主题
const loadTheme = () =>
  import("react-syntax-highlighter/dist/esm/styles/prism").then(
    (mod) => mod.oneDark
  );

// 代码高亮组件
function CodeHighlighter({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [theme, setTheme] = useState<Record<string, React.CSSProperties> | null>(null);

  useEffect(() => {
    loadTheme().then(setTheme);
  }, []);

  if (!theme) {
    return (
      <pre className="rounded-lg bg-[#282c34] p-4 overflow-x-auto">
        <code className="text-sm font-mono text-gray-300">{children}</code>
      </pre>
    );
  }

  return (
    <Suspense
      fallback={
        <pre className="rounded-lg bg-[#282c34] p-4 overflow-x-auto">
          <code className="text-sm font-mono text-gray-300">{children}</code>
        </pre>
      }
    >
      <SyntaxHighlighter
        style={theme}
        language={language}
        PreTag="div"
        className="rounded-lg"
      >
        {children}
      </SyntaxHighlighter>
    </Suspense>
  );
}

import { useState, useEffect } from "react";

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
        // 代码块高亮 (懒加载)
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match?.[1] || "";
          const codeContent = String(children).replace(/\n$/, "");

          return !inline && language ? (
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
        // 标题
        h1: ({ children }) => (
          <h1 className="text-3xl md:text-4xl font-serif font-bold mt-8 mb-4 text-foreground">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl md:text-3xl font-serif font-bold mt-8 mb-4 text-foreground">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl md:text-2xl font-serif font-semibold mt-6 mb-3 text-foreground">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg md:text-xl font-serif font-semibold mt-4 mb-2 text-foreground">
            {children}
          </h4>
        ),
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
          <td className="px-4 py-2 text-sm text-muted-foreground">{children}</td>
        ),
        // 图片 (优化加载)
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt}
            className="rounded-lg my-4 max-w-full h-auto"
            loading="lazy"
            decoding="async"
          />
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
