import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { calculateReadTime } from "../shared/read-time.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, "../articles");
const TARGET_DIR = path.join(__dirname, "../client/public/articles");
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

  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const targetPath = path.join(TARGET_DIR, file);
    const slug = file.replace(".md", "");

    // 读取文件内容
    const fileContent = fs.readFileSync(sourcePath, "utf-8");

    // 解析 frontmatter
    const { data, content } = matter(fileContent);

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

syncArticles();
