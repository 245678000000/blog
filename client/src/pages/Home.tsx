import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail } from "lucide-react";
import { Link } from "wouter";
import { getPublishedArticles, type Article } from "@shared/articles";
import { useEffect, useState } from "react";
import { SEO } from "@/components/SEO";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { Newsletter } from "@/components/Newsletter";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [featuredRef, featuredVisible] = useInView();
  const [writingRef, writingVisible] = useInView();
  const [aboutRef, aboutVisible] = useInView();

  useEffect(() => {
    getPublishedArticles().then(setArticles);
  }, []);

  // 获取所有分类
  const categories = [
    "全部",
    ...Array.from(new Set(articles.map(a => a.category))),
  ];

  const featuredArticle = articles[0]; // 第一篇作为精选文章（不受筛选影响）

  // 根据分类过滤文章。精选文章已在上方单独展示，这里排除掉避免重复出现。
  const filteredArticles = articles.filter(
    a =>
      a.slug !== featuredArticle?.slug &&
      (selectedCategory === "全部" || a.category === selectedCategory)
  );

  const displayArticles = filteredArticles.slice(0, 3); // 显示最近 3 篇

  return (
    <>
      {/* Home 同时响应 / 和 /writings。两边都自我 canonical 就是一对重复内容，
          canonical 固定钉在 /——/writings 只是个还在被外链引用的旧地址。 */}
      <SEO
        title="首页"
        description="法学硕士 | AI Native 开发者 | Prompt 工程师。用 Code 和 AI 工具解决真实世界问题。"
        image="/images/hero-bg.jpg"
        canonicalPath="/"
      />

      <div className="flex flex-col gap-24 pb-24">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            {/* 纯装饰背景：alt 必须留空，否则读屏软件会念一句没有信息量的
                "Background"。width/height 取源图真实比例（2752×1536），
                写错的话浏览器按错误比例预留空间，反而制造 CLS。 */}
            <img
              src="/images/hero-bg.jpg"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover opacity-40"
              fetchPriority="high"
              width={2752}
              height={1536}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background"></div>
          </div>

          <div className="container relative z-10 flex flex-col items-start gap-8 max-w-4xl animate-in fade-in-up duration-1000">
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-primary"></div>
              <span className="text-sm font-mono tracking-widest uppercase text-primary">
                Xing Peng
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight">
              <span
                className="animate-line block"
                style={{ animationDelay: "0.2s" }}
              >
                用 Code 和 AI
              </span>
              <span
                className="animate-line block text-primary italic"
                style={{ animationDelay: "0.5s" }}
              >
                解决问题
              </span>
              <span
                className="animate-line block"
                style={{ animationDelay: "0.8s" }}
              >
                拒绝空谈。
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              法学硕士 | AI Native 开发者 | Prompt 工程师。 擅长将 Idea
              快速转化为 Demo，用结构化思维解决复杂逻辑场景。
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              {/* 没有精选文章时（文章全部未发布、articles.json 加载失败）
                  原来会拼出 /article/ 这个死链，退回归档页 */}
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
                asChild
              >
                <Link
                  href={
                    featuredArticle
                      ? `/article/${featuredArticle.slug}`
                      : "/archive"
                  }
                >
                  阅读我的文章 <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-full border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary transition-all"
                onClick={() =>
                  document
                    .getElementById("about")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                关于我
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        {featuredArticle && (
          <section
            ref={featuredRef}
            className={cn(
              "container transition-all duration-700",
              featuredVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            )}
          >
            <div className="flex items-center gap-4 mb-12">
              <span className="text-sm font-mono tracking-widest uppercase text-primary">
                精选文章
              </span>
              <div className="h-[1px] flex-1 bg-border"></div>
            </div>

            <Link href={`/article/${featuredArticle.slug}`}>
              <div className="grid md:grid-cols-2 gap-12 items-center group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl aspect-video shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <img
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    width={1200}
                    height={675}
                  />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge
                      variant="secondary"
                      className="bg-primary/20 text-primary hover:bg-primary/30"
                    >
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
        {/* 注意这里判断的是 articles 而不是 displayArticles：
            displayArticles 会被分类筛选清空，若用它做外层条件，
            选中一个「排除精选后没有文章」的分类会把筛选按钮一起卸载，
            用户就再也点不回「全部」。空态由下方内层分支处理。 */}
        {articles.length > 0 && (
          <section
            ref={writingRef}
            className={cn(
              "container transition-all duration-700",
              writingVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            )}
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="text-sm font-mono tracking-widest uppercase text-primary block mb-4">
                  写作
                </span>
                <h2 className="text-4xl font-serif font-bold">最近文章</h2>
              </div>

              {/* 分类筛选按钮 */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "secondary" : "ghost"
                    }
                    size="sm"
                    className={
                      selectedCategory === category
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
                {displayArticles.map(article => (
                  <Link key={article.slug} href={`/article/${article.slug}`}>
                    <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-lg group h-full cursor-pointer overflow-hidden">
                      {article.image && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            width={1200}
                            height={675}
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="text-primary font-medium">
                            {article.category}
                          </span>
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

            {/* 查看更多 */}
            <div className="flex justify-center mt-12">
              <Button
                variant="outline"
                className="rounded-full px-8 py-6 text-base hover:text-primary hover:border-primary transition-all"
                asChild
              >
                <Link href="/archive">
                  查看更多文章 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* About Me Section */}
        <section
          id="about"
          ref={aboutRef}
          className={cn(
            "container bg-secondary/30 rounded-3xl p-8 md:p-16 relative overflow-hidden transition-all duration-700",
            aboutVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          )}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="order-2 md:order-1">
              <span className="text-sm font-mono tracking-widest uppercase text-primary block mb-4">
                关于我
              </span>
              <h2 className="text-4xl font-serif font-bold mb-6">
                你好，我是邢鹏
              </h2>

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className="bg-primary/20 text-primary border-0">
                  法学硕士
                </Badge>
                <Badge className="bg-primary/20 text-primary border-0">
                  AI Native
                </Badge>
                <Badge className="bg-primary/20 text-primary border-0">
                  SkillsHub
                </Badge>
                <Badge className="bg-primary/20 text-primary border-0">
                  RAG / Harness
                </Badge>
              </div>

              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  上海师范大学法律硕士（国际法方向）在读，专注于将法律方法论引入
                  AI 工程。独立构建并上线{" "}
                  <a
                    href="https://legal-skillshub.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    Legal SkillsHub
                  </a>
                  ，并落地{" "}
                  <strong className="text-foreground">RAG 知识库</strong>
                  、垂直场景{" "}
                  <strong className="text-foreground">Chatbot</strong> 与{" "}
                  <strong className="text-foreground">Agent Harness</strong>。
                </p>
                <p>
                  熟悉检索增强生成、技能包体系与工作流编排，日常以 Claude /
                  Cursor 等工具进行 AI 原生开发。 法学训练带来的边界意识，使
                  Agent
                  不止于生成，更能判断何时引用来源、何时停止、何时交由人工复核。
                </p>
                <p>
                  <em className="text-foreground/80">
                    让 Idea 快速成为可演示、可复用、可分发的产物。
                  </em>
                </p>
              </div>

              <div className="flex flex-wrap gap-4 mt-8">
                <Button
                  variant="outline"
                  className="rounded-full hover:text-primary hover:border-primary px-6"
                  asChild
                >
                  <a
                    href="https://legal-skillshub.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    SkillsHub
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full hover:text-primary hover:border-primary px-6"
                  asChild
                >
                  <a href="mailto:xingpeng278@aliyun.com">
                    <Mail className="mr-2 h-4 w-4" /> 联系我
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full hover:text-primary px-6"
                  asChild
                >
                  <Link href="/about">了解更多 →</Link>
                </Button>
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
                  width={320}
                  height={320}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="container">
          <Newsletter />
        </section>
      </div>
    </>
  );
}
