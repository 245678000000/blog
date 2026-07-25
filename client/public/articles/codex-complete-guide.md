---
title: "Codex 保姆级全攻略：从安装到精通，一期搞懂 OpenAI 的编程 Agent"
date: "2026-07-26"
category: "指南"
readTime: "15 分钟"
description: "OpenAI Codex 不是代码补全工具，而是一个完整的编程 Agent。本文从安装配置到三种执行模式，从实战场景到 AGENTS.md，从审批策略到第三方模型接入，一期全部讲透。"
image: "/images/article-codex-guide.svg"
published: true
tags: ["Codex", "OpenAI", "AI", "编程工具", "Agent"]
---

## 目录

- [Codex 到底是什么](#codex-到底是什么)
- [四种产品形态](#四种产品形态)
- [安装与配置](#安装与配置)
- [三种执行模式](#三种执行模式)
- [实战场景](#实战场景)
- [AGENTS.md：给 Codex 写项目指南](#agentsmd-给-codex-写项目指南)
- [审批策略与安全](#审批策略与安全)
- [第三方模型接入](#第三方模型接入)
- [与 Claude Code / Kimi Code 对比](#与-claude-code--kimi-code-对比)
- [总结](#总结)

## Codex 到底是什么

先纠正一个误解：Codex 不是"代码补全"。

它是 OpenAI 推出的**完整编程 Agent**——能读代码、改代码、跑命令、执行测试、提交 PR。每周有超过 400 万开发者在用它。

和 GitHub Copilot 的区别：Copilot 是"你写一行它补一行"，Codex 是"你说一句话它完成整个任务"。更接近一个初级工程师队友，而不是一个智能输入法。

## 四种产品形态

Codex 不是一个单独的产品，而是一组编程入口：

| 形态 | 适合场景 | 特点 |
|------|----------|------|
| 桌面 App | 日常管理多任务 | GUI 界面，任务面板，文件预览 |
| CLI | 终端党、CI/CD 集成 | 轻量、可脚本化、管道串联 |
| VS Code 扩展 | IDE 内使用 | 不离开编辑器 |
| 云端（Cloud） | 不想拉代码到本地 | OpenAI 沙箱执行，隔离安全 |

我主要用 **CLI + 桌面 App** 的组合：CLI 做快速任务，桌面 App 管理并行任务。

## 安装与配置

### CLI 安装

```bash
# 需要 Node.js v18+
npm install -g @openai/codex

# 验证
codex --version
```

### 登录方式

两种选择：

1. **ChatGPT 账号登录**（推荐，走订阅额度）：
```bash
codex login
# 浏览器弹出授权页面，登录即可
```

2. **API Key 登录**（按量计费，适合 CI/CD）：
```bash
export OPENAI_API_KEY="sk-..."
```

### 配置文件

`~/.codex/config.toml`：

```toml
model = "codex-mini-latest"    # 默认模型
approval_policy = "suggest"    # 审批策略

# 如果要用第三方模型
# model = "qwen3.7-max"
# model_provider = "custom"
# [model_providers.custom]
# base_url = "https://your-api-endpoint/v1"
# env_key = "OPENAI_API_KEY"
```

## 三种执行模式

这是 Codex 最核心的设计——同一个任务，可以选择不同的执行环境：

### 1. 本地模式（Local）

直接在当前工作目录操作文件。最快，但会直接改你的代码。

```bash
codex "修复 login.ts 里的空指针异常"
```

### 2. Worktree 模式

为 Git 分支创建隔离工作区，改完不影响主线。适合"试试看"的场景。

```bash
codex --worktree "把数据库层从 MySQL 迁移到 PostgreSQL"
```

改完后你可以 review diff，满意就 merge，不满意直接丢弃。

### 3. 云端模式（Cloud）

代码在 OpenAI 的云端沙箱执行，本地完全不动。适合：
- 不想把敏感代码拉到本地
- 需要特殊环境（特定 OS、依赖）
- 长时间运行的任务

在桌面 App 或 chatgpt.com/codex 里选择"Cloud"模式即可。

## 实战场景

### 场景 1：自动修 Bug

```bash
codex "run all tests, if any fail, identify the root cause and fix them"
```

它会：跑测试 → 定位失败原因 → 修改代码 → 重新跑测试验证。

### 场景 2：生成 CHANGELOG

```bash
git log --oneline -50 > /tmp/changes.txt
codex "Read /tmp/changes.txt and generate a CHANGELOG.md with conventional commit format"
```

### 场景 3：重构

```bash
codex "refactor the authentication module: extract interface, add unit tests, keep all existing tests passing"
```

### 场景 4：管道串联

```bash
# 让 Codex 分析 PR diff
git diff main..feature | codex "review this diff and list potential issues"
```

## AGENTS.md：给 Codex 写项目指南

在项目根目录创建 `AGENTS.md`，Codex 每次启动都会读取它：

```markdown
# AGENTS.md

## 项目约定
- 使用 TypeScript strict 模式
- 测试框架：Vitest
- 提交信息格式：conventional commits

## 禁止事项
- 不要修改 package.json 的 engines 字段
- 不要删除任何现有的测试文件
- 不要引入新的全局状态

## 构建命令
- npm run build: 完整构建
- npm run test: 运行测试
```

这相当于给新来的"AI 同事"写一份入职手册。我给自己的博客项目也写了一份，效果立竿见影——它不再乱改我的 sync 脚本了。

## 审批策略与安全

Codex 有三档审批策略：

| 策略 | 行为 | 适合场景 |
|------|------|----------|
| `suggest` | 只建议，不执行任何操作 | 学习、review |
| `auto-edit` | 自动改文件，但跑命令前要确认 | 日常开发 |
| `full-auto` | 全自动（改文件+跑命令） | 信任度高的任务 |

```bash
# 在 config.toml 中设置
approval_policy = "auto-edit"

# 或命令行临时指定
codex --approval-mode full-auto "fix all linting errors"
```

我的建议：**日常用 auto-edit**，只在跑测试、格式化这种无风险操作时用 full-auto。

## 第三方模型接入

Codex 不锁定 OpenAI 模型。通过 `config.toml` 可以接入：

- 阿里云百炼（qwen3.7-max）
- 腾讯云开发
- 本地 Ollama / LM Studio
- 任何 OpenAI 兼容 API

```toml
model = "qwen3.7-max"
model_provider = "aliyun"

[model_providers.aliyun]
name = "Aliyun"
base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"
```

甚至可以用 CC Switch 工具在多个供应商之间一键切换。

## 与 Claude Code / Kimi Code 对比

| 维度 | Codex | Claude Code | Kimi Code |
|------|-------|-------------|-----------|
| 执行环境 | 本地/worktree/云端 | 仅本地 | 仅本地 |
| 并行任务 | 桌面 App 原生支持 | 需多终端 | Swarm 支持 |
| 模型选择 | 多供应商 | 仅 Claude | 仅 Kimi |
| 审批机制 | 三档策略 | 有 | 有 |
| AGENTS.md | 原生支持 | 原生支持 | 支持 |
| 价格 | ChatGPT Plus 含额度 | $20/月起 | 99元/月 |
| 云端执行 | 支持 | 不支持 | 不支持 |
| 生态成熟度 | 最成熟 | 成熟 | 较新 |

**我的使用策略**：
- 需要云端执行或并行任务 → Codex
- 复杂推理和长链任务 → Claude Code
- 日常快速任务、中文场景 → Kimi Code

## 总结

Codex 是目前最完整的 AI 编程 Agent 产品。它的核心优势不是"模型更强"，而是**产品设计更成熟**：

- 三种执行模式覆盖所有场景
- 审批策略让你控制风险
- AGENTS.md 让 AI 理解你的项目
- 桌面 App 管理并行任务
- 不锁定模型供应商

如果你只用过 Copilot 的代码补全，强烈建议试试 Codex 的 Agent 模式——那是完全不同的体验。你不是在"写代码"，你是在"指挥一个工程师干活"。

---

*参考视频：[Codex (APP) 保姆级全攻略，海量实战教程，一期精通Codex](https://www.youtube.com/watch?v=4gciWspBVHw)*
