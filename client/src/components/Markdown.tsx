import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import { rehypeHeadingIds } from "@/lib/rehype-heading-ids";
import { lazy, Suspense, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// 懒加载代码高亮组件 + 显式注册文章实际用到的语言。
// 此前用 prism-async-light 会按需动态加载 200+ 语言，产物里有 332 个 JS 分片；
// 改成 PrismLight + registerLanguage 后只打包下列语言，分片数大幅下降。
//
// import 路径必须是字面量：写成模板字符串的话 Vite 会把整个语言目录都打进去，
// 那就又回到 332 个分片了。
//
// 语言名的唯一来源是 @shared/code-languages，validate-article.js 用同一份清单
// 在构建期拦截未注册的语言（否则 Prism 会静默渲染成无高亮纯文本）。
// 两边是否一致由 tests/f12_code_languages.test.ts 断言。
const languageLoaders = {
  bash: () => import("react-syntax-highlighter/dist/esm/languages/prism/bash"),
  java: () => import("react-syntax-highlighter/dist/esm/languages/prism/java"),
  json: () => import("react-syntax-highlighter/dist/esm/languages/prism/json"),
  markdown: () =>
    import("react-syntax-highlighter/dist/esm/languages/prism/markdown"),
  nginx: () =>
    import("react-syntax-highlighter/dist/esm/languages/prism/nginx"),
  toml: () => import("react-syntax-highlighter/dist/esm/languages/prism/toml"),
  typescript: () =>
    import("react-syntax-highlighter/dist/esm/languages/prism/typescript"),
  yaml: () => import("react-syntax-highlighter/dist/esm/languages/prism/yaml"),
};

// 供测试比对，确保与 @shared/code-languages 的 SUPPORTED_CODE_LANGUAGES 不漂移
export const REGISTERED_LANGUAGES = Object.keys(languageLoaders).sort();

const SyntaxHighlighter = lazy(async () => {
  const entries = Object.entries(languageLoaders);
  const [prismLight, ...languages] = await Promise.all([
    import("react-syntax-highlighter/dist/esm/prism-light"),
    ...entries.map(([, load]) => load()),
  ]);
  const PrismLight = prismLight.default;
  entries.forEach(([name], i) => {
    PrismLight.registerLanguage(name, languages[i].default);
  });
  return { default: PrismLight };
}) as any;

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

// 图片 Lightbox 组件。
//
// 用 Radix Dialog 而不是自己糊一个 fixed 遮罩：原来的实现把 onClick 挂在 <img>
// 上，键盘用户根本打不开；打开后也没有 role="dialog"/aria-modal、没有焦点陷阱、
// 关闭后焦点不归还。这些 Radix 都自带，自己重写一遍只会漏掉其中几条。
function ImageLightbox({ src, alt }: { src?: string; alt?: string }) {
  // 不要为了消 CLS 在缩略图的 <img> 上写死 aspect-ratio：<img> 默认
  // object-fit: fill，强行套一个固定比例会把所有非该比例的插图拉变形。
  // 正文图片尺寸各不相同，真要消除 CLS 得拿到每张图的实际宽高。
  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* 触发器是真按钮：键盘可聚焦、回车/空格可激活，读屏软件也会
            announce 成「按钮」而不是一张点不了的图 */}
        <button
          type="button"
          className="block cursor-zoom-in rounded-lg my-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={alt ? `放大查看：${alt}` : "放大查看图片"}
        >
          <img
            src={src}
            alt={alt}
            className="rounded-lg max-w-full h-auto transition-opacity hover:opacity-90"
            loading="lazy"
            decoding="async"
          />
        </button>
      </DialogTrigger>
      <DialogContent
        className="w-auto max-w-[95vw] sm:max-w-[95vw] border-0 bg-transparent p-0 shadow-none"
        // 弹层里只有一张图，没有需要额外描述的内容。
        // 显式传 undefined 是 Radix 声明「有意不提供 description」的方式，
        // 不传的话它会往 console 里刷警告。
        aria-describedby={undefined}
      >
        {/* Radix 要求每个 dialog 有可访问名，视觉上不需要就藏起来 */}
        <DialogTitle className="sr-only">{alt || "图片预览"}</DialogTitle>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </DialogContent>
    </Dialog>
  );
}

// rehype-raw 会把正文里的原始 HTML 原样放进渲染树，单靠 `script: () => null`
// 拦不住 onerror / javascript: 之类的注入向量。这里在 raw 之后接一层白名单清洗：
// 保留 GitHub 风格的常用标签，去掉脚本、事件属性和不安全的协议。
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "details", "summary"],
  attributes: {
    ...defaultSchema.attributes,
    // 代码块高亮依赖 language-* class，必须放行
    code: [
      ...(defaultSchema.attributes?.code || []),
      ["className", /^language-./],
    ],
  },
};

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = "" }: MarkdownProps) {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      // 顺序不能反：先把 raw HTML 解析进树，再清洗，最后才补标题 ID
      //（ID 必须在 sanitize 之后加，否则会被白名单过滤掉）
      rehypePlugins={[
        rehypeRaw,
        [rehypeSanitize, sanitizeSchema],
        rehypeSlug,
        rehypeHeadingIds,
      ]}
      components={{
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
        h1: ({ children, id }) => {
          // 页面级 H1 已由文章页渲染为文章标题，正文里的 `#` 再输出 h1
          // 会让每页出现两个 H1，既影响 SEO 也让读屏软件的大纲失真。
          // 这里降级为 h2，仅保留 h1 的视觉尺寸。
          return (
            <h2
              id={id}
              className="text-3xl md:text-4xl font-serif font-bold mt-8 mb-4 text-foreground scroll-mt-24"
            >
              {children}
            </h2>
          );
        },
        h2: ({ children, id }) => {
          return (
            <h2
              id={id}
              className="text-2xl md:text-3xl font-serif font-bold mt-8 mb-4 text-foreground scroll-mt-24"
            >
              {children}
            </h2>
          );
        },
        h3: ({ children, id }) => {
          return (
            <h3
              id={id}
              className="text-xl md:text-2xl font-serif font-semibold mt-6 mb-3 text-foreground scroll-mt-24"
            >
              {children}
            </h3>
          );
        },
        h4: ({ children, id }) => {
          return (
            <h4
              id={id}
              className="text-lg md:text-xl font-serif font-semibold mt-4 mb-2 text-foreground scroll-mt-24"
            >
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
        img: ({ src, alt }) => <ImageLightbox src={src} alt={alt} />,
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
