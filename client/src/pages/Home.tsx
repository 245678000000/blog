import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail } from "lucide-react";
import { Link } from "wouter";
import { getPublishedArticles, type Article } from "@shared/articles";
import { useEffect, useState } from "react";
import { SEO } from "@/components/SEO";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");

  useEffect(() => {
    getPublishedArticles().then(setArticles);
  }, []);

  // 获取所有分类
  const categories = ["全部", ...Array.from(new Set(articles.map((a) => a.category)))];

  // 根据分类过滤文章
  const filteredArticles = selectedCategory === "全部"
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

  const featuredArticle = articles[0]; // 第一篇作为精选文章（不受筛选影响）
  const displayArticles = filteredArticles.slice(0, 3); // 显示最近 3 篇

  return (
    <>
      <SEO
        title="首页"
        description="法学硕士 | AI Native 开发者 | Prompt 工程师。用 Code 和 AI 工具解决真实世界问题。"
        image="/images/hero-bg.jpg"
      />

      <div className="flex flex-col gap-24 pb-24">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/hero-bg.jpg"
              alt="Background"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background"></div>
          </div>

          <div className="container relative z-10 flex flex-col items-start gap-8 max-w-4xl animate-in fade-in-up duration-1000">
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-primary"></div>
              <span className="text-sm font-mono tracking-widest uppercase text-primary">Xing Peng</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight">
              用 Code 和 AI<br />
              <span className="text-primary italic">解决问题</span>，<br />
              拒绝空谈。
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              法学硕士 | AI Native 开发者 | Prompt 工程师。
              擅长将 Idea 快速转化为 Demo，用结构化思维解决复杂逻辑场景。
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <Link href={`/article/${featuredArticle?.slug || ""}`}>
                <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105">
                  阅读我的文章 <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-full border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary transition-all"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                关于我
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        {featuredArticle && (
          <section className="container">
            <div className="flex items-center gap-4 mb-12">
              <span className="text-sm font-mono tracking-widest uppercase text-primary">精选文章</span>
              <div className="h-[1px] flex-1 bg-border"></div>
            </div>

            <Link href={`/article/${featuredArticle.slug}`}>
              <div className="grid md:grid-cols-2 gap-12 items-center group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl aspect-video shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <img
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
                      {featuredArticle.category}
                    </Badge>
                    <span>{featuredArticle.date}</span>
                    <span>·</span>
                    <span>{featuredArticle.readTime} 阅读时间</span>
                  </div>

                  <h2 className="text-4xl font-serif font-bold group-hover:text-primary transition-colors">
                    {featuredArticle.title}
                  </h2>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {featuredArticle.description}
                  </p>

                  <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform">
                    阅读文章 <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Writing Section */}
        {displayArticles.length > 0 && (
          <section className="container">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="text-sm font-mono tracking-widest uppercase text-primary block mb-4">写作</span>
                <h2 className="text-4xl font-serif font-bold">最近文章</h2>
              </div>

              {/* 分类筛选按钮 */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "secondary" : "ghost"}
                    size="sm"
                    className={selectedCategory === category
                      ? "rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      : "rounded-full hover:bg-secondary"
                    }
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {displayArticles.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                {displayArticles.map((article) => (
                  <Link key={article.slug} href={`/article/${article.slug}`}>
                    <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-lg group h-full cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="text-primary font-medium">{article.category}</span>
                          <span>·</span>
                          <span>{article.date}</span>
                        </div>
                        <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm line-clamp-3">
                          {article.description}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                          阅读更多 <ArrowRight className="ml-1 h-3 w-3" />
                        </span>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                该分类下暂无文章
              </div>
            )}
          </section>
        )}

        {/* About Me Section */}
        <section id="about" className="container bg-secondary/30 rounded-3xl p-8 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="order-2 md:order-1">
              <span className="text-sm font-mono tracking-widest uppercase text-primary block mb-4">关于我</span>
              <h2 className="text-4xl font-serif font-bold mb-6">你好，我是邢鹏</h2>

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className="bg-primary/20 text-primary border-0">法学硕士</Badge>
                <Badge className="bg-primary/20 text-primary border-0">AI Native</Badge>
                <Badge className="bg-primary/20 text-primary border-0">Linux.do 3级</Badge>
              </div>

              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  上海师范大学法律硕士（国际法方向）在读。我不满足于文档工作，热衷于用 <strong className="text-foreground">Code 和 AI 工具</strong>解决真实世界问题。
                </p>
                <p>
                  擅长使用 <strong className="text-foreground">Cursor、Claude</strong> 等 AI 工具进行开发，熟悉 LangChain/CoT 思维链设计。
                  针对复杂逻辑场景（如法律/合规）进行 Few-shot 优化，消除模型幻觉。
                </p>
                <p>
                  法学背景赋予了我极强的逻辑推理与边界情况考虑能力，非常契合 Agent 设计需求。
                </p>
              </div>

              <div className="flex flex-wrap gap-4 mt-8">
                <Button variant="outline" className="rounded-full hover:text-primary hover:border-primary px-6" asChild>
                  <a href="mailto:xingpeng278@aliyun.com">
                    <Mail className="mr-2 h-4 w-4" /> 联系我
                  </a>
                </Button>
                <Link href="/about">
                  <Button variant="ghost" className="rounded-full hover:text-primary px-6">
                    了解更多 →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse"></div>
                <div className="absolute inset-4 rounded-full border-2 border-primary/60"></div>
                <img
                  src="/images/xingpeng-avatar.jpg"
                  alt="邢鹏"
                  className="absolute inset-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)] rounded-full object-cover border-4 border-background shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
