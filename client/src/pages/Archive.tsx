import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import {
  getPublishedArticles,
  getAllTags,
  getAllCategories,
  type Article,
} from "@shared/articles";
import { Calendar, Tag, FolderOpen, X } from "lucide-react";

export default function Archive() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialTag = params.get("tag") || "";
  const initialCategory = params.get("category") || "";

  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [articlesData, tagsData, categoriesData] = await Promise.all([
        getPublishedArticles(),
        getAllTags(),
        getAllCategories(),
      ]);
      setArticles(articlesData);
      setTags(tagsData);
      setCategories(categoriesData);
      setLoading(false);
    }
    loadData();
  }, []);

  // 根据筛选条件过滤文章
  const filteredArticles = articles.filter((article) => {
    if (selectedTag && !article.tags?.includes(selectedTag)) return false;
    if (selectedCategory && article.category !== selectedCategory) return false;
    return true;
  });

  // 按年份分组
  const articlesByYear = filteredArticles.reduce((acc, article) => {
    const year = article.date.split("-")[0];
    if (!acc[year]) acc[year] = [];
    acc[year].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  // 年份倒序排列
  const sortedYears = Object.keys(articlesByYear).sort((a, b) => b.localeCompare(a));

  const clearFilters = () => {
    setSelectedTag("");
    setSelectedCategory("");
    // 更新 URL
    window.history.replaceState({}, "", "/archive");
  };

  const hasFilters = selectedTag || selectedCategory;

  if (loading) {
    return (
      <>
        <SEO title="归档" description="所有文章归档" />
        <div className="container max-w-4xl py-12 flex items-center justify-center min-h-[50vh]">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="归档"
        description={`共 ${articles.length} 篇文章`}
      />

      <div className="container max-w-4xl py-12 animate-in fade-in duration-700">
        {/* 页面标题 */}
        <div className="flex flex-col gap-4 mb-12">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-primary"></div>
            <span className="text-sm font-mono tracking-widest uppercase text-primary">Archive</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold">文章归档</h1>
          <p className="text-lg text-muted-foreground">
            共 {filteredArticles.length} 篇文章
            {hasFilters && ` (已筛选)`}
          </p>
        </div>

        {/* 筛选器 */}
        <div className="mb-12 space-y-6">
          {/* 当前筛选条件 */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">当前筛选:</span>
              {selectedTag && (
                <Badge
                  variant="secondary"
                  className="bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                  onClick={() => setSelectedTag("")}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {selectedTag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {selectedCategory && (
                <Badge
                  variant="secondary"
                  className="bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                  onClick={() => setSelectedCategory("")}
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  {selectedCategory}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                清除全部
              </Button>
            </div>
          )}

          {/* 分类筛选 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> 分类
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(({ category, count }) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "secondary" : "ghost"}
                  size="sm"
                  className={
                    selectedCategory === category
                      ? "rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      : "rounded-full hover:bg-secondary"
                  }
                  onClick={() => setSelectedCategory(selectedCategory === category ? "" : category)}
                >
                  {category}
                  <span className="ml-1.5 text-xs opacity-60">({count})</span>
                </Button>
              ))}
            </div>
          </div>

          {/* 标签筛选 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" /> 标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(({ tag, count }) => (
                <button
                  key={tag}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary"
                  }`}
                  onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                >
                  #{tag}
                  <span className="ml-1 opacity-60">({count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 时间线 */}
        {sortedYears.length > 0 ? (
          <div className="space-y-12">
            {sortedYears.map((year) => (
              <div key={year} className="relative">
                {/* 年份标题 */}
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl font-serif font-bold text-primary">{year}</h2>
                  <div className="h-[1px] flex-1 bg-border"></div>
                  <span className="text-sm text-muted-foreground">
                    {articlesByYear[year].length} 篇
                  </span>
                </div>

                {/* 文章列表 */}
                <div className="space-y-4 pl-4 border-l-2 border-border/50">
                  {articlesByYear[year].map((article) => (
                    <Link key={article.slug} href={`/article/${article.slug}`}>
                      <div className="group relative pl-6 py-3 -ml-[9px] cursor-pointer">
                        {/* 时间线圆点 */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-border group-hover:border-primary transition-colors" />

                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                          {/* 日期 */}
                          <time className="text-sm text-muted-foreground font-mono min-w-[80px] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {article.date.slice(5)}
                          </time>

                          {/* 标题 */}
                          <h3 className="font-serif font-medium group-hover:text-primary transition-colors flex-1">
                            {article.title}
                          </h3>

                          {/* 分类 */}
                          <Badge variant="outline" className="text-xs w-fit">
                            {article.category}
                          </Badge>
                        </div>

                        {/* 标签 */}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-2 pl-0 md:pl-[96px]">
                            {article.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs text-muted-foreground">
                                #{tag}
                              </span>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{article.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {hasFilters ? "没有符合条件的文章" : "暂无文章"}
          </div>
        )}
      </div>
    </>
  );
}
