---
title: "Antigravity CLI 一个月深度使用体验：Gemini CLI 重度用户的真实分享与实用技巧"
date: 2026-06-12
category: 指南
readTime: "8 分钟"
description: "Google DeepMind 技术团队成员 Jack Wotherspoon 分享的 Antigravity CLI 深度使用技巧、异步多代理工作流及从 Gemini CLI 平滑迁移指南。"
image: "/images/article-antigravity.jpg"
published: true
tags: ["Antigravity", "Gemini", "CLI", "AI", "编程工具"]
---

# Antigravity CLI 一个月深度使用体验：Gemini CLI 重度用户的真实分享与实用技巧

---

作为每天在终端里和 AI 代理深度协作的开发者，我过去一个月几乎把 **Antigravity CLI**当成了主力工具。今天想系统分享一下真实使用感受、核心优势、需要适应的地方，以及几个让生产力明显提升的实用技巧。

## 目录
- [TL;DR 快速总结](#tldr-快速总结)
- [Antigravity CLI 的三大核心优势](#antigravity-cli-的三大核心优势)
- [正在改进的三个方面](#正在改进的三个方面)
- [实用技巧：让 Antigravity CLI 真正为你工作](#实用技巧让-antigravity-cli-真正为你工作)
  - [1. 循环的艺术 —— /goal + 子代理](#1-循环的艺术--goal--子代理)
  - [2. 通过 /config 深度自定义](#2-通过-config-深度自定义)
  - [3. 自定义状态栏与终端标题](#3-自定义状态栏与终端标题)
  - [4. 上下文与配额管理](#4-上下文与配额管理)
- [从 Gemini CLI 平滑迁移](#从-gemini-cli-平滑迁移)
- [最终评价](#最终评价)

---

## TL;DR 快速总结

**Antigravity CLI 完全可以作为严肃工程工作的日常主力工具**。

它速度快、原生支持异步多代理协作，尤其在构建「实现 → 验证 → 审查」自动化循环方面非常强大。当然，它还有一些 UX 小问题需要适应（团队正在快速迭代），文档也在持续完善中。

如果你正从 Gemini CLI 迁移过来，建议花一点时间自定义配置，体验会好很多。Antigravity 团队对社区反馈非常积极，欢迎大家多提建议。

---

## Antigravity CLI 的三大核心优势

### ⚡ 速度极快（Snappy）
用 Go 语言编写，并针对 Antigravity harness 深度优化了 Gemini 3.5 Flash 模型，响应和执行速度非常突出。这在高频交互场景下感受特别明显。

### 🔀 异步工作流
这是 Antigravity CLI 最与众不同的设计。它天生为**多代理任务**打造：子代理在后台运行、命令异步执行并在完成后通知你。终端始终保持可用，你可以随时输入下一个提示或斜杠命令，不用干等着。

### ♾️ 强大的循环（Loops）机制
循环是目前社区最热门的话题之一。Antigravity CLI 通过 `/goal` 命令 + 动态子代理的组合，让创建自动化反馈循环变得非常自然和高效。

---

## 正在改进的三个方面

虽然整体已经能用，但以下方向团队正在积极打磨：

- **🧑💻 UX 细节打磨**：例如 Shift+Tab 快速切换模式等快捷键即将推出。目前需要适应一些小 quirks。
- **🏢 企业支持**：支持通过关联 Google Cloud 项目使用企业版，但按 API 消耗计费，需要注意成本。
- **📝 文档完善**：过去两周文档已有明显进步，团队欢迎反馈你希望看到的具体工作流示例，文档会持续丰富。

---

## 实用技巧：让 Antigravity CLI 真正为你工作

### 1. 循环的艺术 —— `/goal` + 子代理

最推荐的入门方式是 **/goal + Verifier（验证者） + Reviewer（审查者）** 子代理。

**基本流程**：
- 用 `/goal` 清晰定义最终目标（最好可衡量）
- 主代理完成初步实现后，触发 Verifier 子代理快速验证（构建、启动服务、Playwright 截图 UI 等）
- Verifier 通过后，触发 Reviewer 子代理（全新上下文、独立视角）审查代码质量、最佳实践和健壮性
- 有问题就反馈给主代理修复，循环直到达到高质量标准

**实用示例提示**（可直接使用或提炼成 Agent Skill）：

```markdown
/goal 将代码库重构为 Rust，并确保所有现有测试通过。当完成后，启动一个使用 Gemini 3.5 Flash (Low) 的 Verifier 子代理来构建项目、启动开发服务器，并使用 Playwright 根据 FRONTEND_GUIDELINES.md 验证 UI 外观。将关键或中等问题反馈给主代理修复。继续直到 Verifier 对抛光后的 UI 满意为止。然后启动使用 Gemini 3.5 Flash (Medium) 的 Reviewer 子代理，根据项目标准、Rust 最佳实践和代码健壮性进行审查。将问题标记给主代理修复。循环此过程，直到 Reviewer 未发现问题且达到高质量贡献标准为止。
```

> [!TIP]
> 把审查和修复流程提炼成一个可复用的 **Agent Skill**（代理技能）。以后你只需输入 `/goal 实现 XX 功能`，skill 会自动处理验证与审查循环，极大提升效率。

同时建议在项目中明确定义“小问题”和“中问题”的标准，帮助代理节省 token，也方便你快速手动处理小问题。

### 2. 通过 `/config` 深度自定义

Antigravity CLI 的强大在于**高度可定制**。刚开始可能觉得和 Gemini CLI 差别较大，但调整好后会爱上它。

主要命令是 `/config`，可以控制终端主题、渲染模式（推荐 `altscreen` 无闪烁）、工具权限等。

> [!IMPORTANT]
> 把 **“Artifact Review” 设置为 "agent decides"**。这能避免每次都手动审查每个中间产物，只在关键节点介入，节省大量时间。

作者分享了自己的配置（包含通知等设置，可能有争议），建议多实验几次，找到最适合自己工作流的组合。

### 3. 自定义状态栏与终端标题

通过 `/statusline` + 自定义脚本，可以在提示框下方显示模型版本、token 使用量、当前分支、对话 ID 等信息。

示例脚本可在 Antigravity CLI 官方仓库找到。作者特别感谢 Google Developer Expert @JKirstaetter 提供的优秀状态栏脚本。

这能让你在长时间会话中随时掌握上下文状态，是生产力小升级。

### 4. 上下文与配额管理

作者使用 Google One AI Pro 账户（能感受到大多数用户的配额限制），以下习惯帮助他最大化利用配额：

- 定期运行 `/context` 审计，修剪或禁用不常用的 MCP servers、上下文文件和 skills
- 完成一个任务后运行 `/clear` 开始新任务（能更好延长配额）
- 注意配额按 **Gemini 模型** 和 **Claude 模型** 分别计算，用完一个可以切换另一个继续工作

Antigravity CLI 会自动管理上下文压缩，无需手动 `/compress` 或 `/compact`。

---

## 从 Gemini CLI 平滑迁移

Google 已将终端体验统一到 Antigravity CLI。

> [!WARNING]
> 使用 Google One / 免费计划的用户建议在 **2026年6月18日前** 完成迁移。

迁移非常简单：
- 首次启动 Antigravity CLI 时会提示自动迁移 Gemini CLI 扩展
- 手动导入命令：
  ```bash
  agy plugin import gemini
  ```
  （导入 Claude 插件用 `agy plugin import claude`）
- 也可直接从 GitHub 安装扩展：
  ```bash
  agy plugin install https://github.com/gemini-cli-extensions/conductor
  ```

**推荐资源**：
- 官方站点：[https://antigravity.google](https://antigravity.google)
- CLI 文档：[https://antigravity.google/docs/cli/overview](https://antigravity.google/docs/cli/overview)
- 迁移指南：可在 `antigravity.google/docs` 下搜索 “Migrating from Gemini CLI” 或 “gcli-migration” 查看最新页面
- GitHub 仓库：[https://github.com/google-antigravity/antigravity-cli](https://github.com/google-antigravity/antigravity-cli)（示例脚本和最新更新在这里）

---

## 最终评价

经过过去一个月高强度使用，我可以自信地说：**Antigravity CLI 已经可以胜任日常代理式工程工作**。它的速度和异步多代理循环能力是真实的生产力提升点。

从 Gemini CLI 切换过来需要一点学习曲线和自定义投入，但一旦调好，你很可能会被它的流畅度和能力 pleasantly surprised。

Antigravity 团队对反馈非常开放，如果你有好的建议或特定工作流想法，欢迎在评论区或官方渠道分享。
