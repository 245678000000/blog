import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/Markdown";
import { SEO } from "@/components/SEO";
import {
  TableOfContents,
  MobileTableOfContents,
  BackToTop,
} from "@/components/TableOfContents";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ShareButtons } from "@/components/ShareButtons";
import { Comments } from "@/components/Comments";
import { Newsletter } from "@/components/Newsletter";
import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import {
  getArticleContent,
  getAdjacentArticles,
  getRelatedArticles,
  type Article,
} from "@shared/articles";

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug || "advent-of-claude-2025"; // 默认文章
  const [article, setArticle] = useState<{
    data: Article;
    content: string;
  } | null>(null);
  const [adjacentArticles, setAdjacentArticles] = useState<{
    prev: Article | null;
    next: Article | null;
  }>({ prev: null, next: null });
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // 快速连续切换文章时，先发出的请求可能后返回。没有这个标记的话，
    // 旧文章的响应会覆盖新文章的状态，页面正文和 URL 就对不上了。
    let cancelled = false;

    async function loadArticle() {
      setLoading(true);
      setNotFound(false);
      // 清空上一篇，避免加载期间短暂显示旧文章的正文/目录
      setArticle(null);
      setAdjacentArticles({ prev: null, next: null });
      setRelatedArticles([]);

      const result = await getArticleContent(slug);
      if (cancelled) return;

      if (!result || !result.published) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // 相邻文章与相关文章互不依赖，并行取，少一个往返
      const [adjacent, related] = await Promise.all([
        getAdjacentArticles(slug),
        getRelatedArticles(slug, 3),
      ]);
      if (cancelled) return;

      setArticle({ data: result, content: result.content });
      setAdjacentArticles(adjacent);
      setRelatedArticles(related);
      setLoading(false);
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <>
        <SEO title="加载中..." />
        <div className="container max-w-3xl py-12 animate-pulse">
          <div className="flex flex-col gap-6">
            {/* 元信息骨架 */}
            <div className="flex items-center gap-4">
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
            {/* 标题骨架 */}
            <div className="h-12 w-3/4 rounded-lg bg-muted" />
            <div className="h-6 w-1/2 rounded bg-muted" />
            {/* 封面图骨架 */}
            <div className="aspect-video w-full rounded-2xl bg-muted" />
            {/* 内容骨架 */}
            <div className="space-y-3 pt-4">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (notFound || !article) {
    return (
      <>
        <SEO title="文章未找到" description="该文章不存在或尚未发布" />
        <div className="container max-w-3xl py-12 flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <h1 className="text-4xl font-serif font-bold">文章未找到</h1>
          <p className="text-muted-foreground">
            抱歉，该文章不存在或尚未发布。
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={article.data.title}
        description={article.data.description}
        image={article.data.image}
        type="article"
        publishedTime={article.data.date}
        keywords={[article.data.category, ...(article.data.tags ?? [])]}
      />

      {/* 阅读进度条 */}
      <ReadingProgress />

      <div className="container max-w-3xl py-12 animate-in fade-in duration-700 relative">
        <div className="flex flex-col gap-8">
          {/* Article Header */}
          <div className="flex flex-col gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground flex-wrap">
              <Badge
                variant="secondary"
                className="bg-primary/20 text-primary hover:bg-primary/30"
              >
                {article.data.category}
              </Badge>
              <span>{article.data.date}</span>
              <span>·</span>
              <span>{article.data.readTime} 阅读时间</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
              {article.data.title}
            </h1>

            {article.data.description && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {article.data.description}
              </p>
            )}

            {/* 标签 */}
            {article.data.tags && article.data.tags.length > 0 && (
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                {article.data.tags.map(tag => (
                  <a
                    key={tag}
                    href={`/archive?tag=${encodeURIComponent(tag)}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Featured Image */}
          {article.data.image && (
            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video">
              <img
                src={article.data.image}
                alt={article.data.title}
                className="w-full h-full object-cover"
                fetchPriority="high"
              />
            </div>
          )}

          {/* Article Content with Code Highlighting */}
          <article className="markdown-content">
            <Markdown content={article.content} />
          </article>

          {/* Share Buttons */}
          <div className="mt-8 pt-8 border-t border-border/50">
            <ShareButtons
              title={article.data.title}
              description={article.data.description}
            />
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border/50">
              <h3 className="text-lg font-serif font-bold mb-4">相关文章</h3>
              <div className="grid gap-3">
                {relatedArticles.map(related => (
                  <Link
                    key={related.slug}
                    href={`/article/${related.slug}`}
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {related.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {related.date} · {related.category}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <Comments />

          {/* Article Navigation (Prev/Next) */}
          <ArticleNavigation
            prev={adjacentArticles.prev}
            next={adjacentArticles.next}
          />

          {/* RSS 提醒 */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            喜欢这篇文章？{" "}
            <a href="/rss.xml" className="text-primary hover:underline">
              订阅 RSS
            </a>{" "}
            获取最新更新。
          </div>

          {/* Newsletter */}
          <div className="mt-8">
            <Newsletter />
          </div>
        </div>

        {/* Table of Contents (Desktop) */}
        <TableOfContents content={article.content} />

        {/* Table of Contents (Mobile) */}
        <MobileTableOfContents content={article.content} />

        {/* Back to Top Button */}
        <BackToTop />
      </div>
    </>
  );
}

// 上一篇/下一篇导航组件
function ArticleNavigation({
  prev,
  next,
}: {
  prev: Article | null;
  next: Article | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-12 pt-8 border-t border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prev ? (
          <Link
            href={`/article/${prev.slug}`}
            className="group flex flex-col gap-2 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-secondary/30 transition-all"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              上一篇
            </span>
            <span className="font-serif font-medium group-hover:text-primary transition-colors line-clamp-2">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={`/article/${next.slug}`}
            className="group flex flex-col gap-2 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-secondary/30 transition-all text-right"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-end gap-1">
              下一篇
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
            <span className="font-serif font-medium group-hover:text-primary transition-colors line-clamp-2">
              {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </nav>
  );
}
