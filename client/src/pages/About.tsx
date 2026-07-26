import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Mail,
  Github,
  MapPin,
  Calendar,
  Code,
  Briefcase,
  GraduationCap,
  Award,
  MessageSquare,
  ExternalLink,
  Bot,
  Database,
  Boxes,
  Sparkles,
  Rocket,
} from "lucide-react";

// 技能数据
const skills = [
  {
    category: "AI Engineering",
    items: [
      "RAG 全流程",
      "Agent Harness",
      "Chatbot / 对话系统",
      "LangChain4j",
      "Claude / Cursor / Antigravity",
      "CoT 思维链",
    ],
  },
  {
    category: "Agent Skills & 产品",
    items: [
      "SKILL.md 体系设计",
      "SkillsHub 构建",
      "工作流编排",
      "结构化 Prompt",
      "Few-shot 优化",
      "幻觉治理",
    ],
  },
  {
    category: "技术栈",
    items: [
      "Java / Spring Boot",
      "Python",
      "TypeScript / React",
      "向量数据库",
      "飞书 API 集成",
      "Git / Vercel",
    ],
  },
  {
    category: "领域 & 社区",
    items: [
      "法律 × AI 交叉",
      "企业知识库",
      "Linux.do 3级",
      "GitHub 活跃贡献",
      "CET-6",
    ],
  },
];

// 精选项目
const projects = [
  {
    title: "Legal SkillsHub",
    tag: "主线产品",
    description:
      "法律人的 Agent Skills 中心：为律师、公司法务、合规与法学生编目 40+ SKILL.md 技能包与多套工作流。中文优先、中国法语境，可一键装入 Claude / Cursor / Grok。每个技能标明适用边界与复核要求，强调「辅助研究，非法律意见」。",
    highlights: ["42+ 技能", "13 套工作流", "领域 × 场景双索引"],
    href: "https://legal-skillshub.vercel.app/",
    icon: Boxes,
  },
  {
    title: "企业知识库 RAG",
    tag: "工程实践",
    description:
      "基于 Java + LangChain4j 的完整 RAG：文档切分、Embedding、向量检索、Rerank 与 Prompt 约束。接入飞书 WIKI 定时同步，支持增量更新与远程删除清理，把「能 demo」做成「能跑批」的知识服务。",
    highlights: ["入库 + 检索闭环", "飞书 WIKI 同步", "一致性清理"],
    href: "/article/rag-feishu-wiki-tutorial",
    icon: Database,
  },
  {
    title: "垂直领域 Chatbot",
    tag: "对话产品",
    description:
      "面向法律 / 合规场景的问答助手：检索增强生成 + 引用片段回显，严格限定回答边界，减少幻觉。配合 Agent Harness（任务拆解、工具调用、循环验证）把「闲聊机器人」升级为可协作的工作代理。",
    highlights: ["引用可追溯", "边界约束", "Harness 循环"],
    href: null,
    icon: Bot,
  },
];

// 经历时间线
const timeline = [
  {
    year: "2026",
    title: "Legal SkillsHub 上线",
    organization: "独立构建 · legal-skillshub.vercel.app",
    description:
      "从 0 到 1 搭建法律人 Agent Skills 平台：技能编目、工作流精选集、注意等级与安装体验。把「会写 Prompt」产品化为可复用、可分发的 Skills 基础设施。",
    icon: Rocket,
  },
  {
    year: "2025.09 - 2027.06",
    title: "法律硕士 (国际法方向)",
    organization: "上海师范大学",
    description:
      "专注 AI 与法律交叉：合规自动化、知识库问答、Agent 在法务场景中的边界与责任。",
    icon: GraduationCap,
  },
  {
    year: "2025.11",
    title: "「大学生 AI 赋能司法」创新挑战赛",
    organization: "项目负责人",
    description:
      "探索 LLM 在司法行政领域的垂直应用，验证长文本逻辑分析与结构化输出潜力。",
    icon: Award,
  },
  {
    year: "2025",
    title: "RAG / Chatbot / Harness 工程实践",
    organization: "个人项目 & 技术写作",
    description:
      "落地检索增强生成、企业知识库同步与 Agent 循环（实现 → 验证 → 审查）。在 Linux.do 等社区分享 Java + LangChain4j 全流程与飞书 WIKI 接入经验。",
    icon: Sparkles,
  },
  {
    year: "2023.07 - 2023.10",
    title: "法律文书自动化生成系统",
    organization: "核心开发者 & 产品负责人 · 三等奖",
    description:
      "设计 Agent Workflow 自动化生成链路，针对法条引用幻觉做结构化约束与人工复核节点。",
    icon: Code,
  },
  {
    year: "2023.06 - 2023.08",
    title: "实习律师助理",
    organization: "缓化正达律师事务所 · 上海",
    description:
      "数据清洗、深度检索，将非结构化法律文本转化为可检索、可分析的结构化数据。",
    icon: Briefcase,
  },
  {
    year: "2023.11 - 2023.12",
    title: "校辩论队队长",
    organization: "逻辑思维训练",
    description:
      "高强度逻辑拆解训练，构建 Chain-of-Thought 式论证闭环——后来直接迁移到 Agent 设计里。",
    icon: MessageSquare,
  },
  {
    year: "2021.09 - 2025.06",
    title: "法学本科",
    organization: "上海师范大学",
    description: "核心课程：知识产权法 (AI 版权方向)、逻辑学。",
    icon: GraduationCap,
  },
];

export default function About() {
  return (
    <>
      <SEO
        title="关于我"
        description="邢鹏 - 法学硕士 | AI Native 开发者 | Legal SkillsHub 作者 | RAG / Chatbot / Agent Harness 实践者"
      />

      <div className="container max-w-4xl py-12 animate-in fade-in duration-700">
        {/* 页面标题 */}
        <div className="flex flex-col gap-4 mb-12">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-primary"></div>
            <span className="text-sm font-mono tracking-widest uppercase text-primary">
              About
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold">关于我</h1>
        </div>

        {/* 个人介绍卡片 */}
        <Card className="mb-12 bg-secondary/30 border-border/50">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-[200px_1fr] gap-8 items-start">
              {/* 头像 */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse"></div>
                  <img
                    src="/images/xingpeng-avatar.jpg"
                    alt="邢鹏"
                    className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] rounded-full object-cover border-4 border-background shadow-xl"
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-serif font-bold">邢鹏</h2>
                  <p className="text-sm text-muted-foreground">Xing Peng</p>
                </div>
              </div>

              {/* 简介 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>上海，中国</span>
                </div>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary"
                  >
                    法学硕士
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary"
                  >
                    AI Native 开发者
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary"
                  >
                    SkillsHub 作者
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary"
                  >
                    RAG 实践者
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary"
                  >
                    Linux.do 3级
                  </Badge>
                </div>

                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    你好！我是邢鹏，上海师范大学法律硕士（国际法方向）在读，一名把{" "}
                    <strong className="text-foreground">法律方法论</strong> 和{" "}
                    <strong className="text-foreground">AI 工程</strong>{" "}
                    拧在一起的开发者。
                  </p>
                  <p>
                    我做{" "}
                    <a
                      href="https://legal-skillshub.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium underline-offset-4 hover:underline"
                    >
                      Legal SkillsHub
                    </a>
                    ——法律人的 Agent Skills 中心；也会亲手搭{" "}
                    <strong className="text-foreground">RAG 知识库</strong>
                    、垂直场景{" "}
                    <strong className="text-foreground">Chatbot</strong>
                    ，以及能「实现 → 验证 → 审查」闭环的{" "}
                    <strong className="text-foreground">Agent Harness</strong>。
                  </p>
                  <p>
                    法学训练给了我对边界、例外与可追责性的敏感度——这恰好是靠谱
                    Agent
                    最缺的那一层：不只会生成，还知道何时该停、该引用、该让人复核。
                  </p>
                  <p>
                    <em>
                      Idea 能快速变成可演示、可复用、可分发的东西。拒绝空谈。
                    </em>
                  </p>
                </div>

                {/* 联系方式 */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button variant="outline" className="rounded-full" asChild>
                    <a href="mailto:xingpeng278@aliyun.com">
                      <Mail className="w-4 h-4 mr-2" />
                      邮箱
                    </a>
                  </Button>
                  <Button variant="outline" className="rounded-full" asChild>
                    <a
                      href="https://github.com/245678000000"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="outline" className="rounded-full" asChild>
                    <a
                      href="https://legal-skillshub.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Boxes className="w-4 h-4 mr-2" />
                      SkillsHub
                    </a>
                  </Button>
                  <Button variant="outline" className="rounded-full" asChild>
                    <a
                      href="https://linux.do/u/user400/summary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Linux.do
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 精选项目 */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
            <Rocket className="w-6 h-6 text-primary" />
            在做什么
          </h2>
          <div className="grid gap-6">
            {projects.map(project => (
              <Card
                key={project.title}
                className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <project.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-serif font-bold">
                          {project.title}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-primary/15 text-primary text-xs"
                        >
                          {project.tag}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.highlights.map(h => (
                          <Badge
                            key={h}
                            variant="outline"
                            className="border-border/60 text-muted-foreground font-normal"
                          >
                            {h}
                          </Badge>
                        ))}
                      </div>
                      {project.href && (
                        <div className="pt-1">
                          {project.href.startsWith("http") ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full px-0 h-auto text-primary hover:bg-transparent hover:underline"
                              asChild
                            >
                              <a
                                href={project.href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                访问项目
                                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                              </a>
                            </Button>
                          ) : (
                            <Link
                              href={project.href}
                              className="inline-flex items-center text-sm text-primary hover:underline"
                            >
                              阅读相关文章
                              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 技能 */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
            <Code className="w-6 h-6 text-primary" />
            技能栈
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map(skillGroup => (
              <Card
                key={skillGroup.category}
                className="bg-card/50 border-border/50"
              >
                <CardContent className="p-6">
                  <h3 className="text-sm font-mono text-primary uppercase tracking-wider mb-4">
                    {skillGroup.category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillGroup.items.map(skill => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-secondary/50 hover:bg-primary/20 hover:text-primary transition-colors"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 经历时间线 */}
        <section>
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            经历
          </h2>
          <div className="space-y-6 pl-4 border-l-2 border-border/50">
            {timeline.map((item, index) => (
              <div key={index} className="relative pl-8">
                <div className="absolute left-0 top-0 -translate-x-1/2 w-10 h-10 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>

                <div className="pt-1">
                  <span className="text-sm text-primary font-mono">
                    {item.year}
                  </span>
                  <h3 className="text-lg font-serif font-bold mt-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.organization}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
