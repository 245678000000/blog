#!/bin/bash

# 新建文章脚本
# 使用方法: ./scripts/new-post.sh "文章标题" "分类"

TITLE=$1
CATEGORY=${2:-"技术"}
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')

if [ -z "$TITLE" ]; then
  echo "❌ 请提供文章标题"
  echo "用法: ./scripts/new-post.sh \"文章标题\" \"分类\""
  exit 1
fi

# 创建文章文件
ARTICLE_PATH="client/public/articles/${SLUG}.md"

cat > "$ARTICLE_PATH" << EOF
---
title: "${TITLE}"
date: "${DATE}"
category: "${CATEGORY}"
description: "在这里写文章简介..."
image: "/images/article-1.jpg"
published: false
tags: []
---

# ${TITLE}

在这里开始写你的文章...

## 第一部分

内容...

## 第二部分

内容...

EOF

echo "✅ 文章已创建: ${ARTICLE_PATH}"
echo ""
echo "📝 下一步:"
echo "1. 编辑文章内容: ${ARTICLE_PATH}"
echo "2. 设置 published: true 来发布"
echo "3. 更新 articles.json 添加文章元数据"
echo "4. git add . && git commit -m '新文章: ${TITLE}' && git push"
