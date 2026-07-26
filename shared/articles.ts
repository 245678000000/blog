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
}

export interface ArticleWithContent extends Article {
  content: string;
}

// 缓存文章数据，避免重复请求
let articlesCache: Article[] | null = null;

// 解析 frontmatter 的文章内容
export function parseArticleFrontmatter(markdown: string): {
  data: Article;
  content: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    // 如果没有 frontmatter，返回默认值
    return {
      data: {
        slug: "",
        title: "未命名文章",
        date: new Date().toISOString().split("T")[0],
        category: "未分类",
        // 留空，交给调用方按正文长度计算，见 getArticleContent
        readTime: "",
        description: "",
        image: "",
        published: true,
      },
      content: markdown,
    };
  }

  const frontmatterText = match[1];
  const content = match[2];

  // 解析 YAML frontmatter
  const data: Article = {
    slug: "",
    title: "未命名文章",
    date: new Date().toISOString().split("T")[0],
    category: "未分类",
    // 留空，交给调用方按正文长度计算，见 getArticleContent
    readTime: "",
    description: "",
    image: "",
    published: true,
  };

  // 简单的 YAML 解析器（适用于基本的 key: value 格式）
  const lines = frontmatterText.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // 移除引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    switch (key) {
      case "title":
        data.title = value;
        break;
      case "date":
        data.date = value;
        break;
      case "category":
        data.category = value;
        break;
      case "readTime":
        data.readTime = value;
        break;
      case "description":
        data.description = value;
        break;
      case "image":
        data.image = value;
        break;
      case "published":
        data.published = value === "true";
        break;
      case "tags":
        // 解析 tags 数组（格式: [tag1, tag2] 或 tag1, tag2）
        if (value.startsWith("[") && value.endsWith("]")) {
          data.tags = value
            .slice(1, -1)
            .split(",")
            .map(t => t.trim().replace(/["']/g, ""))
            .filter(t => t.length > 0);
        } else {
          data.tags = value
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0);
        }
        break;
    }
  }

  return { data, content };
}

// 获取文章内容（从 .md 文件）
export async function getArticleContent(
  slug: string
): Promise<ArticleWithContent | null> {
  try {
    const response = await fetch(`/articles/${slug}.md`);
    if (!response.ok) {
      return null;
    }
    const markdown = await response.text();
    const { data, content } = parseArticleFrontmatter(markdown);

    // 自动计算阅读时间（如果 frontmatter 中没有指定）
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
async function loadArticlesFromJson(): Promise<Article[]> {
  if (articlesCache) {
    return articlesCache;
  }

  try {
    const response = await fetch("/articles/articles.json");
    if (!response.ok) {
      console.error("Failed to load articles.json");
      return [];
    }
    const data = await response.json();
    articlesCache = data as Article[];
    return articlesCache;
  } catch (error) {
    console.error("Failed to parse articles.json:", error);
    return [];
  }
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
