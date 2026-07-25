---
title: "Hermes Agent 保姆级教学：越用越聪明的本地 AI 私人助理，用过就回不去了"
date: "2026-07-26"
category: "指南"
readTime: "14 分钟"
description: "Hermes Agent 是 Nous Research 推出的开源自进化 AI Agent：本地部署、跨会话记忆、自动学习技能、接入 15+ 聊天平台。本文记录我从安装到日常使用的完整体验，以及它为什么让 OpenClaw 用户大规模迁移。"
image: "/images/article-hermes-agent.svg"
published: true
tags: ["Hermes Agent", "AI", "开源", "本地部署", "Agent"]
---

## 目录

- [为什么从 OpenClaw 迁移到 Hermes](#为什么从-openclaw-迁移到-hermes)
- [Hermes Agent 是什么](#hermes-agent-是什么)
- [安装：一条命令搞定](#安装一条命令搞定)
- [核心能力：记忆 + 技能 + 自进化](#核心能力记忆--技能--自进化)
- [接入聊天平台：微信、Telegram、飞书](#接入聊天平台微信telegram飞书)
- [模型选择：云端还是本地](#模型选择云端还是本地)
- [实战：我的日常使用场景](#实战我的日常使用场景)
- [安全与隐私：为什么它最安全](#安全与隐私为什么它最安全)
- [与 OpenClaw 对比](#与-openclaw-对比)
- [总结](#总结)

## 为什么从 OpenClaw 迁移到 Hermes

用了三个月 OpenClaw，我最大的痛点是：**每次新会话都要重新解释一遍项目背景**。

"我的项目用 TypeScript + Vite，测试用 Vitest，部署在 Vercel……" 这段话我打了不下一百遍。OpenClaw 很强，但它没有持久记忆——每次对话都是一张白纸。

然后我发现了 Hermes Agent。用了两周后，我再也没打开过 OpenClaw。

不是因为 Hermes 模型更强（它甚至不绑定任何模型），而是因为它**记得我**。

## Hermes Agent 是什么

Hermes Agent 是 Nous Research 在 2026 年 2 月发布的**开源自进化 AI Agent**，MIT 许可证，GitHub 21.6 万星。

官方标语：**"The agent that grows with you."**（与你一起成长的智能体）

它和 ChatGPT / Claude 的本质区别：

| | 传统聊天机器人 | Hermes Agent |
|---|---|---|
| 记忆 | 每次会话清零 | 跨会话持久记忆 |
| 学习 | 不会 | 自动提炼可复用技能 |
| 运行位置 | 云端 | 你的机器/VPS |
| 数据 | 在别人的服务器 | 全部在本地 |
| 主动性 | 你问它答 | 可定时自动执行任务 |

简单说：ChatGPT 是一个"每次见面都失忆的顾问"，Hermes 是一个"跟你共事三年越来越默契的助理"。

## 安装：一条命令搞定

```bash
# Linux / macOS / WSL2
curl -fsSL https://res1.hermesagent.org.cn/install.sh | bash

# Windows (PowerShell)
irm https://res1.hermesagent.org.cn/install.ps1 | iex
```

装完后运行 `hermes setup`，按提示选择：
1. 模型提供商（OpenRouter / OpenAI / 本地 Ollama）
2. 聊天平台（Telegram 最简单，5 分钟配好）
3. 工作目录

整个过程不到 10 分钟。

## 核心能力：记忆 + 技能 + 自进化

这是 Hermes 最核心的设计——**四层记忆架构**：

1. **Prompt 常驻层**：你的基本偏好、项目背景（类似 CLAUDE.md）
2. **会话档案层**：SQLite FTS5 全文搜索，历史对话随时调取
3. **技能层（Skills）**：解决过的问题自动沉淀为 SKILL.md
4. **用户建模层**：通过 Honcho 理解你的习惯和偏好

**自进化循环**是这样的：

```
接到任务 → 解决问题 → 自动文档化为 Skill
→ 下次遇到类似任务 → 直接调用 Skill → 更快更好
```

我用了两周后，Hermes 已经积累了 23 个 Skill。现在让它"帮我写一篇博客文章"，它直接调用之前沉淀的写作流程 Skill，连 frontmatter 格式都不用我再说一遍。

## 接入聊天平台：微信、Telegram、飞书

Hermes 支持 15+ 平台：微信、飞书、企业微信、钉钉、QQ、Telegram、Discord、Slack、WhatsApp……

我配了 Telegram（最简单）：

1. 在 Telegram 找 @BotFather 创建 Bot，拿到 Token
2. 在 Hermes 配置里填入 Token
3. 完事。直接在 Telegram 里跟你的 Agent 对话

这意味着：你在手机上就能给 Agent 下任务，它在你 VPS 上执行，结果推回你手机。真正的"随身 AI 助理"。

## 模型选择：云端还是本地

Hermes 是**模型无关**的，你可以用：

- **OpenRouter**：200+ 模型任选（Claude、GPT、Gemini、Qwen……）
- **OpenAI API**：直连
- **本地模型**：Ollama + Hermes-3 8B / Qwen 35B（完全离线）
- **任何 OpenAI 兼容端点**

我的配置：日常用 OpenRouter 的 Claude Sonnet（快、便宜），敏感任务切本地 Ollama（数据不出机器）。

## 实战：我的日常使用场景

### 场景 1：每日技术简报

设了 cron 定时任务，每天早上 8 点自动：
- 搜索 AI/编程领域最新新闻
- 整理成简报
- 推送到我的 Telegram

### 场景 2：博客文章辅助

"帮我根据这个链接写一篇第一人称博客文章"——它记得我的写作风格、frontmatter 格式、标签偏好。

### 场景 3：项目上下文保持

"继续昨天那个认证模块的重构"——它记得昨天改了什么、为什么那么改、下一步计划是什么。

### 场景 4：代码审查

接入 GitHub Webhook，每个 PR 自动审查，结果推送到 Slack。

## 安全与隐私：为什么它最安全

这是 Hermes 相比所有 SaaS AI 产品的**结构性优势**：

- **MIT 开源**：每行代码可审计，没有黑箱
- **零遥测**：不收集任何使用数据
- **本地存储**：所有记忆在 `~/.hermes/` 目录，不上传
- **容器加固**：只读根目录、权限降级、PID 限制
- **无云端锁定**：随时可以迁移、备份、删除

对于注重数据隐私的用户（比如我这种把法学论文素材喂给 AI 的人），这是唯一让我放心的选择。

## 与 OpenClaw 对比

| 维度 | Hermes Agent | OpenClaw |
|------|-------------|----------|
| 记忆 | 跨会话持久 | 每次清零 |
| 自学习 | 自动沉淀 Skill | 不支持 |
| 部署 | 本地/VPS/Docker | 云端为主 |
| 数据隐私 | 全部本地 | 在服务器 |
| 开源 | MIT 完全开源 | 部分开源 |
| 聊天平台 | 15+（含微信） | 有限 |
| 模型选择 | 任意（含本地） | 绑定 |
| 安全记录 | 良好 | 2026.3 曝 9 个漏洞 |
| 上手难度 | 需要命令行基础 | 较简单 |
| 社区 | 21.6 万星，活跃 | 较大 |

OpenClaw 依然是一个好工具，但如果你需要**持久记忆 + 数据主权 + 自进化**，Hermes 是目前唯一的选择。

## 总结

Hermes Agent 改变了我对 AI 工具的认知：

- 它不是"更聪明的 ChatGPT"，而是一个**会成长的数字助理**
- 前两周是投入期（教它你的习惯），之后是复利期（它越来越懂你）
- 本地部署 + 零遥测 = 真正的数据主权
- 接入微信/Telegram 后，它真的像一个 24 小时在线的私人助理

如果你受够了"每次都要重新解释一遍"，试试 Hermes。用过就回不去了。

---

*参考视频：[Hermes Agent 保姆級教學！最安全的 AI 私人助理造成 OpenClaw 大規模棄養潮](https://www.youtube.com/watch?v=-EivK7vpOXY)*
