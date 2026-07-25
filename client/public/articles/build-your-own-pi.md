---
title: "动手学 Pi：从一条运行轨迹开始，亲手造一个 AI Agent"
date: "2026-07-26"
category: "指南"
readTime: "12 分钟"
description: "用 TypeScript 从零实现一个完整的 AI Agent——不是调 API 的玩具，而是真正理解 Agent Loop、工具协议、EventStream 和 Context Compaction 的底层原理。"
image: "/images/article-1.jpg"
published: true
tags: ["Agent", "TypeScript", "AI", "编程工具"]
---

## 目录

- [为什么我要学这个](#为什么我要学这个)
- [课程长什么样](#课程长什么样)
- [四个让我恍然大悟的概念](#四个让我恍然大悟的概念)
- [课程最狠的地方：失败优先](#课程最狠的地方失败优先)
- [适合谁](#适合谁)
- [最终评价](#最终评价)

## 为什么我要学这个

用了大半年 Claude Code 和 Cursor，我能让 Agent 帮我写代码、跑测试、修 Bug。但说实话，我一直停留在"用户"的层面——我知道它能做什么，却不知道它**怎么做到的**。

模型返回一个 `toolCall`，然后呢？工具结果怎么配对回去？上下文窗口满了怎么办？Agent 怎么知道该停下来？

这些问题在我脑子里模糊了很久，直到我发现了[动手学 Pi](https://build-your-own-pi-cn.enochzhang.chatgpt.site/)——一门用 TypeScript 从零实现 AI Agent 的课程。不是那种"调个 OpenAI API 就完事"的教程，而是真的从一条运行轨迹出发，把 Agent 的每一层拆开给你看。

## 课程长什么样

15 个 Checkpoint，分四个阶段：

**阶段 I（基础协议）**：TypeScript 生存集、EventStream、消息与工具往返、ScriptedModel、模型调用的 HTTP 转换。

**阶段 II（Agent 核心）**：工具调用协议、Agent Loop、四个文件工具在同一个 workspace 里协作。

**阶段 III（状态与记忆）**：有状态 Agent、会话树、Context Compaction。

**阶段 IV（产品化）**：知识与信任门、Runtime 集成、独立评测。

每一章都留下一个可恢复的 checkpoint，所有代码可编译，关键 trace 由测试固定。课程从第 0 章就开始让你看一条完整的运行轨迹：

```
user → 读取 README，修复失败测试
model → toolCall · read({ path })
tool → toolResult · 文件内容
model → toolCall · edit({ oldText, newText })
tool → toolResult · exact replacement
model → toolCall · bash({ command: npm test })
loop → stop · 修改完成，测试通过
```

七步，一次完整的 Agent 闭环。看完这个 trace，我突然觉得之前用 Claude Code 时那些"魔法"都不神秘了。

## 四个让我恍然大悟的概念

### 1. Agent Loop：模型调用两次完成一次往返

以前我以为 Agent 就是"把问题丢给模型，模型返回答案"。学完第 7 章我才明白，一次最简单的 README 读取，模型至少被调用**两次**：

- 第一次：模型看到用户消息，决定调用 `read` 工具
- 第二次：模型看到工具结果，决定直接回答（或继续调用）

Loop 的终止条件不是"模型返回了文本"，而是模型**不再发出 toolCall**。这个认知看似简单，但它解释了为什么 Agent 有时候会"卡住"——不是模型笨，是 Loop 的退出条件没设计好。

### 2. 工具协议：配对是灵魂

第 6 章讲工具调用，核心就一句话：**每个 toolCall 必须有且仅有一个同 id 的 toolResult 与之配对**。

参数经过 JSON Schema 校验 → Registry 查找执行器 → executor 运行 → 结果带着相同的 `toolCallId` 返回。如果配对断了（比如 id 不一致、结果丢失），整个消息历史就"脏"了，模型下一步的推理全部不可信。

这让我理解了为什么 Claude Code 在执行工具时那么"较真"——它不是矫情，是在维护消息协议的不变量。

### 3. EventStream：一个对象，两种交付

第 2 章的 EventStream 是我觉得最优雅的设计。同一个对象既负责"流式交付下一项"（`next()`），又负责"最终交付完整结果"（`result()`）。

```typescript
// 消费者可以逐条处理
for await (const event of stream) {
  render(event);
}
// 也可以等最终结果
const final = await stream.result();
```

两种到达顺序（先 push 完再取 result，或者先 await result 再回头遍历）都能正确工作。这个模式后来我在 Vercel AI SDK 的源码里也看到了类似的影子。

### 4. Context Compaction：历史不动，上下文按预算重建

这是第 11 章，也是我觉得最实用的一章。

问题：对话越来越长，上下文窗口装不下了怎么办？

 naive 的做法是截断旧消息。但课程教的方法是：

1. 把工具往返（toolCall + toolResult）组成**不可拆分的交互单元**
2. 在预算内选择完整的**后缀**（最近的消息优先）
3. 对更早的内容生成**结构化摘要**，追加到上下文头部

关键原则：**历史（transcript）永远不动**，被压缩的只是"喂给模型的上下文视图"。这就像法律里的"原始证据不可篡改，但可以做摘要呈堂"——我的法学直觉在这里意外地派上了用场。

## 课程最狠的地方：失败优先

大多数教程是"跟着做，做对了继续"。这门课反过来——**先让你看到偏差，再定位是哪一层的责任**。

比如第 4 章，ScriptedModel 第一次播放时故意让 cursor 越界，测试红灯。你要做的不是"修好它"，而是回答：这个故障属于哪一层？是消息投影的问题，还是 microtask 调度的问题？

这种"从故障定位责任层"的训练，比写一百个 happy path 都有用。课程原话说得好：

> 延迟、无提示、换一个故障情境后，仍能守住消息配对、状态所有权和历史不变量，才说明你真的会造 Agent。

## 适合谁

- **AI 工具重度用户**（Claude Code / Cursor / Windsurf）：想从"会用"升级到"知道为什么"
- **想自己造 Agent 的开发者**：不想依赖框架黑箱，想理解每一层在干什么
- **TypeScript 中级以上**：课程代码全是 TS，需要熟悉联合类型、泛型和 ESM

不适合：
- 只想调 API 出 Demo 的（这门课太"慢"了）
- 没有 TypeScript 基础的（第 1 章就是类型体操）

## 最终评价

| 维度 | 评分 |
|------|------|
| 深度 | 目前中文 Agent 教程里最深的一本，没有之一 |
| 代码质量 | 全部可编译，测试固定边界，不是伪代码 |
| 节奏 | 偏慢，每章 100-240 分钟，需要耐心 |
| 实用性 | 学完能独立设计 Agent 架构，不再依赖框架 |

如果你和我一样，用 AI 工具用了很久，但始终觉得隔了一层纱——推荐花两周时间跟完这门课。它不会让你"更快地用 Agent"，但会让你**真正地理解 Agent**。

---

*课程地址：[build-your-own-pi-cn.enochzhang.chatgpt.site](https://build-your-own-pi-cn.enochzhang.chatgpt.site/)*
