---
title: "RAG 全流程实现 + 飞书 WIKI 文档接入完整教程"
date: "2026-07-14"
category: "指南"
readTime: "15 分钟"
description: "使用 Java + LangChain4j 搭建完整 RAG 知识库问答，并接入飞书 WIKI 实现定时同步、增量更新与数据一致性清理。"
image: "/images/article-rag-feishu.jpg"
published: true
tags: ["RAG", "LangChain4j", "飞书", "Java", "Spring Boot", "向量数据库"]
---

# RAG 全流程实现 + 飞书 WIKI 文档接入完整教程

## （Java + LangChain4j + 开源代码）

> **环境要求**：JDK 8 + LangChain4j 0.35 + Spring Boot  
> **源码位置**：完整项目代码已在 Linux.do 论坛提供（第一弹 + 第二弹帖子内含所有类、配置、Mapper 等）。  
> **原文链接**：
> - 第一弹（RAG 全流程）：https://linux.do/t/topic/2364008
> - 第二弹（飞书 WIKI 接入）：https://linux.do/t/topic/2379034
>
> **系列说明**：本文将两弹内容**合并整理**成一个连贯教程，便于阅读和实践。第一部分搭建 RAG 基础框架，第二部分扩展为自动同步飞书 WIKI 知识库。

---

## 前言

RAG（Retrieval Augmented Generation，检索增强生成）是目前构建企业知识库问答系统最主流的技术方案。本教程使用 **Java + LangChain4j** 实现完整 RAG 流程，并进一步接入**飞书 WIKI** 作为知识源，实现定时自动同步、增量更新、数据一致性清理。

**强烈建议按顺序阅读**：先理解 RAG 基础流程和代码，再看飞书接入部分。

---

## 第一部分：RAG 基础全流程实现

### 一、核心概念（大白话）

- **RAG**：先检索知识库相关片段，再喂给 LLM 生成答案。
- **Embedding**：把文本转为向量（语义相近的距离近）。
- **Reranker**：对初步召回结果二次精排。
- **向量数据库**：高效存储和相似度检索向量（InMemory 测试、Chroma 本地、Milvus 分布式生产）。

### 二、RAG 通用流程

#### 入库流程（Indexing）

文件 → 解析为文本 → 分割器（Chunking + 重叠） → Embedding → 向量数据库 + 关系型数据库记录元数据。

#### 提问流程（Retrieval + Generation）

问题 →（可选重写）→ Embedding → 向量检索 Top K → 相似度阈值过滤 → Reranker 精排 → 构造 Prompt（参考文档 + 问题） → LLM 生成。

### 三、代码实践

#### 1. LangChain4j 配置（`LangChain4jConfig.java`）

```java
@Configuration
public class LangChain4jConfig {

    @Value("${langchain4j.open-ai.chat-model.api-key}")
    private String chatApiKey;

    // ... embedding、vector store 配置

    @Bean
    public EmbeddingModel embeddingModel() {
        return OpenAiEmbeddingModel.builder()
                .baseUrl("你的 embedding base url")
                .apiKey("你的 key")
                .modelName("bge-large-zh-v1.5")  // 示例，512 token 上限
                .build();
    }

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        // 推荐：Chroma 或 Milvus（生产）
        // return new InMemoryEmbeddingStore<>(); // 仅测试
    }
}
```

#### 2. 入库核心 Service（`DocumentIngestionService.java`）

**文件判重 + 解析 + 入库**

```java
public DocumentInfo ingestDocument(String fileName, InputStream inputStream) throws IOException {
    byte[] content = IOUtils.toByteArray(inputStream);
    String hash = sha256(content);

    if (documentsMapper.selectOne(...) != null) {
        return ...; // 已存在跳过
    }

    Document document = parseDocument(fileName, new ByteArrayInputStream(content));
    return processAndSave(document, fileName, "UPLOAD", hash, ...);
}
```

**核心入库逻辑 `processAndSave`**

```java
private DocumentInfo processAndSave(...) {
    Tokenizer tokenizer = new OpenAiTokenizer(OpenAiChatModelName.GPT_3_5_TURBO);
    String prefix = "[来源:" + fileName + "]\n";
    int prefixTokenCount = tokenizer.estimateTokenCountInText(prefix);

    int maxSegmentSize = Math.max(50, 512 - prefixTokenCount); // 动态适配 embedding 上限
    int maxOverlap = 51;

    DocumentSplitter splitter = DocumentSplitters.recursive(maxSegmentSize, maxOverlap, tokenizer);
    List<TextSegment> segments = splitter.split(document);
    segments.replaceAll(ts -> TextSegment.from(prefix + ts.text()));

    // 批量 Embedding（每批 10 条，失败降级单条）
    List<Embedding> allEmbeddings = ...;
    List<TextSegment> successSegments = ...;
    // ... embedAll + 异常处理

    List<String> vectorIds = embeddingStore.addAll(allEmbeddings, successSegments);

    // 写入关系型 DB（Documents + DocumentChunks）
    Documents docRecord = new Documents();
    // ... set feishu* 字段留空（飞书接入时使用）
    documentsMapper.insert(docRecord);

    for (int i = 0; i < successSegments.size(); i++) {
        DocumentChunks chunk = new DocumentChunks();
        chunk.setDocumentId(docRecord.getId());
        chunk.setVectorId(vectorIds.get(i));
        chunk.setChunkText(successSegments.get(i).text());
        documentChunksMapper.insert(chunk);
    }
    return new DocumentInfo(...);
}
```

**文件解析示例（Word）**：使用 Apache POI 解析段落和表格（其他格式类似，可扩展）。

### 四、检索流程要点（代码在完整源码中）

- 问题重写（指代词触发 LLM 重写）
- Embedding 检索 + 余弦相似度阈值过滤（示例 0.77）
- Reranker 精排
- Prompt 优化（严格基于参考文档）
- LLM 调用

---

## 第二部分：接入飞书 WIKI 文档（知识库自动同步）

### 一、飞书平台准备

#### 1. 飞书开放平台创建企业应用

- 访问 [开发者后台](https://open.feishu.cn/app)
- 创建应用 → 审核启用（个人版飞书账号即可实验）

#### 2. 赋予权限（权限管理菜单）

复制以下 scopes（tenant）：

```json
{
  "scopes": {
    "tenant": [
      "bitable:app:readonly",
      "docx:document:readonly",
      "drive:drive:readonly",
      "drive:file:readonly",
      "wiki:wiki:readonly"
    ]
  }
}
```

#### 3. 添加机器人能力 + 发布版本

#### 4. 获取 `app-id` 和 `app-secret`

#### 5. 飞书 App 侧操作

1. 创建群聊 → 拉入机器人
2. 在群聊中新建知识库（WIKI）
3. 将群聊（机器人）添加为 WIKI 管理员（设置 → 成员设置 → 管理员）
4. 从 WIKI 设置页面 URL 获取 `space-id`（例如 `https://.../wiki/settings/666666` 中的 666666）

### 二、项目实现

#### 1. 配置属性（`application.yml` 或启动参数）

```yaml
app:
  feishu:
    cron: "0 0 2 * * ?"          # 每天凌晨 2 点
    space-id: "你的 space-id"
    app-id: "你的 app-id"
    app-secret: "你的 app-secret"
sync-enable: true
```

启动示例：

```bash
-Dapp.feishu.space-id=666666 -Dapp.feishu.app-id=xxx -Dapp.feishu.app-secret=xxx -Dsync-enable=true
```

#### 2. FeishuClient（核心客户端）

**获取 tenant_access_token（带缓存刷新）**

```java
public String getAccessToken() {
    if (cachedToken != null && !isExpired()) return cachedToken;
    // POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
    // body: {"app_id": "...", "app_secret": "..."}
    // 缓存并设置过期时间（7200s - 60s buffer）
}
```

**获取 WIKI 节点树（递归 + 分页）**

```java
public List<WikiNode> getWikiNodeTree(String spaceId) {
    List<WikiNode> result = new ArrayList<>();
    collectNodes(spaceId, null, result);  // DFS 递归
    return result;
}

private void collectNodes(String spaceId, String parentNodeToken, List<WikiNode> result) {
    // /open-apis/wiki/v2/spaces/{spaceId}/nodes 或 /nodes/{parent}/children
    // page_size=50, page_token 分页
    // 解析 node_token, obj_token, obj_type, title, obj_edit_time, has_child
    // 如果 has_child 递归调用
}
```

**内容获取方法**（按 `objType` 分发）

- `doc` / `docx` → `getDocumentContent(objToken)`
- `sheet` → `getSheetContent(objToken)`
- `bitable` → `getBitableContent(objToken)`

（具体 HTTP 调用参考飞书官方文档，源码中已实现）

#### 3. 定时同步 Service（`FeishuSyncService.java`）

```java
@Scheduled(cron = "${app.feishu.cron}")
public void syncWiki() {
    List<WikiNode> nodes = feishuClient.getWikiNodeTree(spaceId);

    int synced = 0, skipped = 0, failed = 0;

    for (WikiNode node : nodes) {
        String nodeToken = node.getNodeToken();
        long updateTime = node.getUpdateTime();
        String objType = node.getObjType();

        Documents doc = documentsMapper.selectOne(
            Wrappers.<Documents>lambdaQuery().eq(Documents::getFeishuNodeToken, nodeToken)
        );

        // 1. 已存在且未更新 → 跳过
        if (doc != null && doc.getFeishuUpdateTime() != null 
                && doc.getFeishuUpdateTime() == updateTime) {
            skipped++; continue;
        }

        // 2. 更新或新增：先清理旧数据
        if (doc != null) {
            List<DocumentChunks> oldChunks = ...select by documentId;
            embeddingStore.removeAll(oldChunks 的 vectorIds);
            documentChunksMapper.delete(...);
            documentsMapper.deleteById(doc.getId());
        }

        // 3. 获取内容
        String content, fileName;
        switch (objType) {
            case "doc": case "docx":
                content = feishuClient.getDocumentContent(node.getObjToken());
                fileName = node.getNodeTitle() + "_文档";
                break;
            case "sheet":
                content = feishuClient.getSheetContent(...);
                fileName = ... + "_表格";
                break;
            case "bitable":
                content = feishuClient.getBitableContent(...);
                fileName = ... + "_多维表格";
                break;
            default: skipped++; continue;
        }

        // 4. 调用入库（复用第一部分逻辑，传入 feishu 字段）
        ingestionService.ingestFeishuDocument(fileName, content, nodeToken, updateTime, objType);
        synced++;
    }

    // 5. 清理远程已删除的文档
    List<String> remoteTokens = nodes.stream().map(WikiNode::getNodeToken).collect(...);
    List<Documents> toRemove = documentsMapper.selectList(
        Wrappers.<Documents>lambdaQuery()
            .isNotNull(Documents::getFeishuNodeToken)
            .notIn(Documents::getFeishuNodeToken, remoteTokens)
    );
    for (Documents removed : toRemove) {
        // 删除 chunks + vectors + documents 记录
        ...
    }
}
```

**Documents 实体扩展字段**（已在前文入库逻辑预留）：

- `feishuNodeToken`
- `feishuObjType`
- `feishuUpdateTime`
- `creator`

### 三、数据一致性保障

- **更新检测**：通过 `feishuUpdateTime` 判断
- **更新处理**：先删旧向量 + chunks + 文档记录，再重新入库
- **远程删除清理**：对比远程节点 token 列表，清理本地孤儿数据
- **最终一致性**：Job 定时运行即可

### 四、测试流程

1. 在飞书 WIKI 里新建/修改几个测试文档。
2. 配置好 `app-id`、`app-secret`、`space-id` 和 cron。
3. 手动触发或等待 Job 执行。
4. 检查 `Documents` 表、`DocumentChunks` 表、向量数据库。
5. 在 RAG 查询接口测试检索效果。
6. 在飞书删除一个文档 → 再次运行 Job → 确认本地数据被清理。

---

## 第三部分：最佳实践与注意事项

- **Embedding 模型 token 上限**：切换模型需重新入库全部数据。
- **分割策略**：`maxSegmentSize` + `maxOverlap` 根据文档类型微调（代码中已动态计算前缀 token）。
- **权限与安全**：飞书 app 权限最小化；生产环境 token 安全存储。
- **Job 频率**：根据 WIKI 更新频率调整（示例每天凌晨或每 5 分钟）。
- **监控与日志**：记录 synced/skipped/failed 数量、token 消耗。
- **扩展方向**：第三弹接口限流（令牌桶 + AOP）、Reranker 自定义实现、权限 Metadata 过滤。
- **生产建议**：使用 Milvus + 持久化关系型数据库；添加重试机制和告警。

---

## 结语

通过本文，你已经掌握了：

1. 使用 LangChain4j 构建完整 RAG 入库与检索流程。
2. 将飞书 WIKI 作为动态知识源，实现自动同步、增量更新和数据清理。

完整可运行源码请参考 Linux.do 原文帖子（包含所有配置、实体、Client、Service、Mapper 等）。

欢迎在评论区反馈问题、分享你的实践案例，或提出对后续限流篇的需求！

**一起把企业知识库 RAG 玩得更专业、更丝滑！**

---

*本文由第一弹 + 第二弹内容合并整理优化而成，保留原作者核心代码与思路，并增强结构与说明。实际部署请以最新源码为准。*
