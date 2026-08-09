// 文章数据访问层。
// 新增文章的流程：在 articles/ 目录创建 .md（带 frontmatter），
// 然后运行 `npm run sync`，脚本会同步到 client/public/articles/ 并重建 articles.json。

import { calculateReadTime } from "./read-time.js";

// 自动计算阅读时间（实现见 shared/read-time.js，与构建脚本共用一份）
export { calculateReadTime };

export interface Article {
  slug: string;
  title: string;
  date: string;
  category: string;
  readTime: string;
  description: string;
  image: string;
  published: boolean;
  tags?: string[]; // 文章标签
  updated?: string; // 最后修改日期（可选），用于 sitemap lastmod
}

export interface ArticleWithContent extends Article {
  content: string;
}

// 缓存文章数据，避免重复请求。
// 存的是 Promise 而不是结果：只缓存结果的话，两个调用方在第一次请求返回之前
// 同时进来，缓存都还是空的，于是各发一次 articles.json。
// 文章页的 Promise.all([getAdjacentArticles, getRelatedArticles]) 正是这个场景。
let articlesPromise: Promise<Article[]> | null = null;

// 浏览器不再解析 YAML：元数据在构建期由 gray-matter 解析并写入
// articles.json，文章页、列表页和归档页都必须以它为唯一来源。
// 这里只负责从 Markdown 响应中去掉 frontmatter，不解释其中的字段。
function stripArticleFrontmatter(markdown: string): string {
  return markdown.replace(
    /^---[^\S\r\n]*(?:\r?\n)[\s\S]*?\r?\n---[^\S\r\n]*(?:\r?\n|$)/,
    ""
  );
}

// 获取文章内容（从 .md 文件）
export async function getArticleContent(
  slug: string
): Promise<ArticleWithContent | null> {
  try {
    // articles.json 与 Markdown 并行请求。getArticleBySlug 与其他文章数据
    // 调用共用 Promise 缓存，因此不会为文章页额外发一次 articles.json。
    const [data, response] = await Promise.all([
      getArticleBySlug(slug),
      fetch(`/articles/${slug}.md`),
    ]);
    if (!data || !response.ok) {
      return null;
    }
    const markdown = await response.text();
    const content = stripArticleFrontmatter(markdown);

    // sync 脚本会写入 readTime；保留兜底，便于兼容旧的 articles.json。
    const readTime = data.readTime || calculateReadTime(content);

    return {
      ...data,
      slug,
      content,
      readTime,
    };
  } catch (error) {
    console.error("Failed to load article:", error);
    return null;
  }
}

// 从 articles.json 加载所有文章元数据
function loadArticlesFromJson(): Promise<Article[]> {
  if (articlesPromise) {
    return articlesPromise;
  }

  articlesPromise = (async () => {
    try {
      const response = await fetch("/articles/articles.json");
      if (!response.ok) {
        console.error("Failed to load articles.json");
        return [];
      }
      return (await response.json()) as Article[];
    } catch (error) {
      console.error("Failed to parse articles.json:", error);
      return [];
    }
  })();

  // 失败不缓存：网络抖动导致的一次空列表不该让整站的文章列表永久为空，
  // 下一次调用应该能重试。
  return articlesPromise.then(articles => {
    if (articles.length === 0) {
      articlesPromise = null;
    }
    return articles;
  });
}

// 获取所有已发布的文章（元数据）
// 从 articles.json 动态加载，不再硬编码
export async function getPublishedArticles(): Promise<Article[]> {
  const articles = await loadArticlesFromJson();
  return articles.filter(a => a.published);
}

// 根据 slug 获取文章元数据
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getPublishedArticles();
  return articles.find(a => a.slug === slug) || null;
}

// 获取相邻文章（用于上一篇/下一篇导航）
export async function getAdjacentArticles(currentSlug: string): Promise<{
  prev: Article | null;
  next: Article | null;
}> {
  const articles = await getPublishedArticles();
  const currentIndex = articles.findIndex(a => a.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? articles[currentIndex - 1] : null,
    next:
      currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null,
  };
}

// 获取所有标签及其文章数量
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const articles = await getPublishedArticles();
  const tagCounts = new Map<string, number>();

  articles.forEach(article => {
    (article.tags || []).forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// 根据标签获取文章
export async function getArticlesByTag(tag: string): Promise<Article[]> {
  const articles = await getPublishedArticles();
  return articles.filter(a => a.tags?.includes(tag));
}

// 获取所有分类及其文章数量
export async function getAllCategories(): Promise<
  { category: string; count: number }[]
> {
  const articles = await getPublishedArticles();
  const categoryCounts = new Map<string, number>();

  articles.forEach(article => {
    categoryCounts.set(
      article.category,
      (categoryCounts.get(article.category) || 0) + 1
    );
  });

  return Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// 按年份分组文章（用于归档页面）
export async function getArticlesByYear(): Promise<Map<string, Article[]>> {
  const articles = await getPublishedArticles();
  const byYear = new Map<string, Article[]>();

  articles.forEach(article => {
    const year = article.date.split("-")[0];
    if (!byYear.has(year)) {
      byYear.set(year, []);
    }
    byYear.get(year)!.push(article);
  });

  // 按年份倒序排列
  return new Map(
    Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  );
}

// 获取相关文章（基于共同标签数量排序）
export async function getRelatedArticles(
  currentSlug: string,
  limit: number = 3
): Promise<Article[]> {
  const articles = await getPublishedArticles();
  const current = articles.find(a => a.slug === currentSlug);
  if (!current) return [];

  const currentTags = new Set(current.tags || []);
  if (currentTags.size === 0) {
    // 没有标签时返回同分类文章
    return articles
      .filter(a => a.slug !== currentSlug && a.category === current.category)
      .slice(0, limit);
  }

  return articles
    .filter(a => a.slug !== currentSlug)
    .map(a => {
      const commonTags = (a.tags || []).filter(t => currentTags.has(t)).length;
      return { article: a, score: commonTags };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.article);
}
