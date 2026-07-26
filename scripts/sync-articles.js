import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { calculateReadTime } from "../shared/read-time.js";
import { validateArticle, findDuplicateSlugs } from "./validate-article.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, "../articles");
const TARGET_DIR = path.join(__dirname, "../client/public/articles");
const PUBLIC_DIR = path.join(__dirname, "../client/public");
const ARTICLES_JSON_PATH = path.join(TARGET_DIR, "articles.json");

// 确保目标目录存在
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

function syncArticles() {
  console.log("🔄 开始同步文章...");

  // 读取源目录下的所有 markdown 文件
  const files = fs.readdirSync(SOURCE_DIR).filter(file => file.endsWith(".md"));
  const articles = [];

  // 清理目标目录中多余的 md 文件（可选，防止重命名后残留）
  const targetFiles = fs.existsSync(TARGET_DIR)
    ? fs.readdirSync(TARGET_DIR).filter(file => file.endsWith(".md"))
    : [];

  for (const targetFile of targetFiles) {
    if (!files.includes(targetFile)) {
      console.log(`🗑️  删除多余文件: ${targetFile}`);
      fs.unlinkSync(path.join(TARGET_DIR, targetFile));
    }
  }

  // 先整体校验一遍再落盘：任何一篇不合规就中止，不产出半套 articles.json。
  // 这些问题（带空格的文件名、缺字段、坏日期）如果放过，会一路走到线上
  // 变成重复收录、坏链接或空白页，那时排查成本高得多。
  const parsed = files.map(file => {
    const slug = file.replace(/\.md$/, "");
    const { data, content } = matter(
      fs.readFileSync(path.join(SOURCE_DIR, file), "utf-8")
    );
    return { file, slug, data, content };
  });

  const errors = [
    ...parsed.flatMap(entry =>
      validateArticle({ ...entry, publicDir: PUBLIC_DIR })
    ),
    ...findDuplicateSlugs(parsed),
  ];

  if (errors.length > 0) {
    throw new Error(
      `文章校验未通过，共 ${errors.length} 个问题：\n${errors.join("\n")}\n\n` +
        `请修正后重新运行 npm run sync。`
    );
  }

  for (const { file, slug, data, content } of parsed) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const targetPath = path.join(TARGET_DIR, file);

    // 计算阅读时间（如果 frontmatter 中没有）
    const readTime = data.readTime || calculateReadTime(content);

    // 构建文章元数据
    const articleData = {
      slug,
      title: data.title || "未命名文章",
      date: data.date
        ? new Date(data.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      category: data.category || "未分类",
      readTime,
      description: data.description || "",
      image: data.image || "",
      published: data.published !== false, // 默认为 true
      tags: data.tags || [],
    };

    articles.push(articleData);

    // 复制文件到目标目录
    // 注意：这里我们直接复制原始内容，因为前端可能会自己解析 frontmatter
    // 或者我们可以选择去掉 frontmatter 只保留内容，但为了兼容现有逻辑（前端解析），直接复制最稳妥
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ 同步文件: ${file}`);
  }

  // 按日期降序排序
  articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 写入 articles.json
  fs.writeFileSync(ARTICLES_JSON_PATH, JSON.stringify(articles, null, 2));
  console.log(`🎉 已生成 articles.json，共 ${articles.length} 篇文章`);
}

try {
  syncArticles();
} catch (error) {
  console.error(`\n❌ ${error.message}\n`);
  process.exit(1);
}
