import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";

// 技能数据
const skills = [
  { category: "AI Engineering", items: ["Cursor", "Claude", "Antigravity", "LangChain", "CoT 思维链"] },
  { category: "Prompt Engineering", items: ["结构化 Prompt", "Few-shot 优化", "RAG", "Agent Workflow"] },
  { category: "技术栈", items: ["Python", "Git", "Markdown", "React", "TypeScript"] },
  { category: "社区 & 语言", items: ["Linux.do 3级", "GitHub 活跃贡献者", "CET-6 英语"] },
];

// 经历时间线
const timeline = [
  {
    year: "2025.09 - 2027.06",
    title: "法律硕士 (国际法方向)",
    organization: "上海师范大学",
    description: "专注于 AI 与法律交叉领域研究",
    icon: GraduationCap,
  },
  {
    year: "2025.11",
    title: ""大学生 AI 赋能司法"创新挑战赛",
    organization: "项目负责人",
    description: "探索 LLM 在司法行政领域的垂直应用，验证长文本逻辑分析潜力",
    icon: Award,
  },
  {
    year: "2023.07 - 2023.10",
    title: "法律文书自动化生成系统",
    organization: "核心开发者 & 产品负责人 · 三等奖",
    description: "设计 Agent Workflow 自动化生成链路，解决法条引用幻觉问题",
    icon: Code,
  },
  {
    year: "2023.06 - 2023.08",
    title: "实习律师助理",
    organization: "缓化正达律师事务所 · 上海",
    description: "数据清洗、深度检索，将非结构化法律文本转化为结构化数据",
    icon: Briefcase,
  },
  {
    year: "2023.11 - 2023.12",
    title: "校辩论队队长",
    organization: "逻辑思维训练",
    description: "带领团队进行高强度逻辑拆解训练，构建 Chain-of-Thought 论证闭环",
    icon: MessageSquare,
  },
  {
    year: "2021.09 - 2025.06",
    title: "法学本科",
    organization: "上海师范大学",
    description: "核心课程：知识产权法 (AI 版权方向)、逻辑学",
    icon: GraduationCap,
  },
];

export default function About() {
  return (
    <>
      <SEO
        title="关于我"
        description="了解更多关于邢鹏的信息 - 法学硕士 | AI Native 开发者 | Prompt 工程师"
      />

      <div className="container max-w-4xl py-12 animate-in fade-in duration-700">
        {/* 页面标题 */}
        <div className="flex flex-col gap-4 mb-12">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-primary"></div>
            <span className="text-sm font-mono tracking-widest uppercase text-primary">About</span>
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
                  <Badge variant="secondary" className="bg-primary/20 text-primary">法学硕士</Badge>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">AI Native 开发者</Badge>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">Linux.do 3级</Badge>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">GitHub 活跃贡献者</Badge>
                </div>

                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    你好！我是邢鹏，上海师范大学法律硕士（国际法方向）在读，一名 <strong className="text-foreground">AI Native 开发者</strong>。
                  </p>
                  <p>
                    我不满足于文档工作，热衷于用 <strong className="text-foreground">Code 和 AI 工具</strong>解决真实世界问题。
                    擅长使用 Cursor、Claude 等 AI 工具进行开发，熟悉 LangChain/CoT 思维链设计。
                  </p>
                  <p>
                    法学背景赋予了我极强的<strong className="text-foreground">逻辑推理</strong>与边界情况 (Edge Case) 考虑能力，
                    这非常契合 Agent 设计需求。我擅长编写结构化 Prompt，针对复杂逻辑场景进行 Few-shot 优化，消除模型幻觉。
                  </p>
                  <p>
                    <em>Idea 能快速转化为 Demo，拒绝空谈。</em>
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
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="outline" className="rounded-full" asChild>
                    <a href="https://linux.do" target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Linux.do
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 技能 */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
            <Code className="w-6 h-6 text-primary" />
            技能栈
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map((skillGroup) => (
              <Card key={skillGroup.category} className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-mono text-primary uppercase tracking-wider mb-4">
                    {skillGroup.category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillGroup.items.map((skill) => (
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
                {/* 时间线图标 */}
                <div className="absolute left-0 top-0 -translate-x-1/2 w-10 h-10 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>

                <div className="pt-1">
                  <span className="text-sm text-primary font-mono">{item.year}</span>
                  <h3 className="text-lg font-serif font-bold mt-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.organization}</p>
                  <p className="text-muted-foreground mt-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
