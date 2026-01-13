import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/Markdown";
import { SEO } from "@/components/SEO";
import { TableOfContents, MobileTableOfContents, BackToTop } from "@/components/TableOfContents";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ShareButtons } from "@/components/ShareButtons";
import { Comments } from "@/components/Comments";
import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { getArticleContent, getAdjacentArticles, type Article } from "@shared/articles";

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug || "advent-of-claude-2025"; // 默认文章
  const [article, setArticle] = useState<{ data: Article; content: string } | null>(null);
  const [adjacentArticles, setAdjacentArticles] = useState<{
    prev: Article | null;
    next: Article | null;
  }>({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      setLoading(true);
      setNotFound(false);

      const result = await getArticleContent(slug);
      if (!result) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!result.published) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setArticle({ data: result, content: result.content });

      // 获取相邻文章
      const adjacent = await getAdjacentArticles(slug);
      setAdjacentArticles(adjacent);

      setLoading(false);
    }

    loadArticle();
  }, [slug]);

  if (loading) {
    return (
      <>
        <SEO title="加载中..." />
        <div className="container max-w-3xl py-12 flex items-center justify-center min-h-[50vh]">
          <div className="text-muted-foreground">加载中...</div>
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
          <p className="text-muted-foreground">抱歉，该文章不存在或尚未发布。</p>
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
        keywords={[article.data.category]}
      />

      {/* 阅读进度条 */}
      <ReadingProgress />

      <div className="container max-w-3xl py-12 animate-in fade-in duration-700 relative">
        <div className="flex flex-col gap-8">
          {/* Article Header */}
          <div className="flex flex-col gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground flex-wrap">
              <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
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
                {article.data.tags.map((tag) => (
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

          {/* Comments */}
          <Comments />

          {/* Article Navigation (Prev/Next) */}
          <ArticleNavigation prev={adjacentArticles.prev} next={adjacentArticles.next} />
        </div>

        {/* Table of Contents (Desktop) */}
        <TableOfContents />

        {/* Table of Contents (Mobile) */}
        <MobileTableOfContents />

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
          <a
            href={`/article/${prev.slug}`}
            className="group flex flex-col gap-2 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-secondary/30 transition-all"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一篇
            </span>
            <span className="font-serif font-medium group-hover:text-primary transition-colors line-clamp-2">
              {prev.title}
            </span>
          </a>
        ) : (
          <div />
        )}

        {next ? (
          <a
            href={`/article/${next.slug}`}
            className="group flex flex-col gap-2 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-secondary/30 transition-all text-right"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-end gap-1">
              下一篇
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <span className="font-serif font-medium group-hover:text-primary transition-colors line-clamp-2">
              {next.title}
            </span>
          </a>
        ) : (
          <div />
        )}
      </div>
    </nav>
  );
}
