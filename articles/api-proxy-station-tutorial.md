---
title: "手把手搭建 API 中转站：VPS + CPA + New API + Docker + Nginx + SSL 全流程"
date: "2026-07-26"
category: "指南"
readTime: "15 分钟"
description: "从零搭建一个完整的 AI API 中转站：Docker 编排 CPA + New API + PostgreSQL + Redis，Nginx 反向代理 + Cloudflare SSL，实现多模型统一管理、token 监控和 HTTPS 对外服务。"
image: "/images/article-api-proxy.svg"
published: true
tags: ["Docker", "Nginx", "Cloudflare", "API", "VPS"]
---

## 目录

- [为什么要搭中转站](#为什么要搭中转站)
- [架构概览](#架构概览)
- [准备工作](#准备工作)
- [Docker Compose 一键部署](#docker-compose-一键部署)
- [New API 配置](#new-api-配置)
- [域名 + Cloudflare + Nginx + SSL](#域名--cloudflare--nginx--ssl)
- [安全加固](#安全加固)
- [踩坑记录](#踩坑记录)
- [总结](#总结)

## 为什么要搭中转站

用了几个月 Claude Code 和 Cursor 之后，我遇到了几个痛点：

1. **Token 焦虑**：不知道每个工具消耗了多少 token，月底账单吓一跳
2. **多账号管理混乱**：好几个认证文件散落在不同设备，换台电脑就得重新配
3. **想给团队/朋友共享**：直接把 key 给别人不安全，也没法限流

于是我决定搭一个中转站——统一管理认证、监控用量、通过一个 HTTPS 端点对外提供服务。

## 架构概览

最终的技术栈长这样：

```
用户请求 → Cloudflare (CDN/DDoS防护)
         → Nginx (SSL终止 + 反向代理)
         → New API (token监控 + 渠道管理 + 令牌分发)
         → CPA (CLI Proxy API, 认证文件管理 + 模型路由)
         → 上游模型 (Claude/GPT/Gemini...)
```

各组件职责：

| 组件 | 作用 |
|------|------|
| CPA | 管理 OAuth 认证文件，路由请求到上游模型 |
| New API | token 用量统计、多渠道管理、令牌分发、用户管理 |
| Nginx | SSL 终止、反向代理、流式输出支持 |
| Docker Compose | 一键编排所有服务 |
| Cloudflare | DNS 代理、DDoS 防护、SSL 证书签发 |

## 准备工作

### VPS 选择

我用的腾讯云 2C2G（硅谷节点），一年 99 元新人价。配置要求不高：
- 2 核 CPU + 2G 内存足够
- 地区选硅谷（延迟低，不需要备案）
- 系统：CentOS 7+ / Ubuntu 20+

### 目录结构

```bash
mkdir -p /opt/proxy/{cpa/{logs,auths},newapi/{data,logs}} && cd /opt/proxy && touch docker-compose.yml cpa/config.yaml
```

最终目录树：

```
/opt/proxy/
├── docker-compose.yml
├── cpa/
│   ├── config.yaml      # CPA 配置
│   ├── auths/           # OAuth 认证文件
│   └── logs/
└── newapi/
    ├── data/            # 数据库数据
    └── logs/
```

### CPA 配置（config.yaml）

关键参数：

```yaml
host: ""
port: 8317
remote-management:
  allow-remote: true
  secret-key: "$2a$10$..."  # 修改为你自己的管理密钥
auth-dir: "~/.cli-proxy-api"
api-keys:
  - sk-your-own-key-here    # 修改为你自己的 API Key
debug: true
logging-to-file: true
routing:
  strategy: "round-robin"   # 多凭据轮询
usage-statistics-enabled: false  # 用 New API 统计，这里关掉
```

## Docker Compose 一键部署

一个 `docker-compose.yml` 编排 4 个服务：

```yaml
services:
  new-api:
    image: calciumion/new-api:latest
    container_name: new-api
    restart: always
    command: --log-dir /app/logs
    ports:
      - '3000:3000'
    volumes:
      - ./newapi/data:/data
      - ./newapi/logs:/app/logs
    environment:
      - SQL_DSN=postgresql://root:你的密码@postgres:5432/new-api
      - REDIS_CONN_STRING=redis://redis
      - TZ=Asia/Shanghai
    depends_on:
      - redis
      - postgres
      - cpa

  redis:
    image: redis:latest
    container_name: redis
    restart: always

  postgres:
    image: postgres:15
    container_name: postgres
    restart: always
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: 你的密码
      POSTGRES_DB: new-api
    volumes:
      - pg_data:/var/lib/postgresql/data

  cpa:
    image: eceasy/cli-proxy-api:latest
    container_name: cpa
    volumes:
      - ./cpa/config.yaml:/CLIProxyAPI/config.yaml
      - ./cpa/auths:/root/.cli-proxy-api
      - ./cpa/logs:/CLIProxyAPI/logs
    restart: always

volumes:
  pg_data:
```

启动：

```bash
cd /opt/proxy && docker compose up -d
```

看到 4 个容器全部 Started 就成功了。访问 `http://你的IP:3000` 能看到 New API 面板。

## New API 配置

### 添加渠道

进入 New API 管理后台 → 渠道管理 → 添加渠道：

- **名称**：CPA
- **密钥**：CPA config.yaml 里配置的 api-key
- **API 地址**：`http://cpa:8317`（Docker 内网通信，用服务名）
- **模型**：点击"获取"自动拉取

### 设置模型价格

系统管理 → 模型价格 → 更新价格。不设置的话测试渠道会报错。

### 创建令牌

令牌管理 → 添加令牌 → 设置名称和额度。这个令牌就是给下游用户用的 key。

## 域名 + Cloudflare + Nginx + SSL

裸 IP + 端口号不够优雅，也不安全。我来加上域名和 HTTPS。

### 1. Cloudflare 托管域名

1. 在 Cloudflare 添加你的域名
2. 去域名注册商（阿里云/Namesilo）把 NS 改为 Cloudflare 给的地址
3. 等 1-10 分钟生效

### 2. DNS 解析

在 Cloudflare DNS 里添加 A 记录：
- 名称：`api`（最终域名 `api.yourdomain.com`）
- 内容：你的 VPS IP
- 代理状态：开启（橙色云朵）

### 3. SSL 证书

Cloudflare → SSL/TLS → 源服务器 → 创建证书 → 输入 `api.yourdomain.com` → 得到 pem 和 key 文件。

### 4. Nginx 配置

把 Nginx 也加入 Docker Compose，关键配置（api.conf）：

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/api.pem;
    ssl_certificate_key /etc/nginx/ssl/api.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://new-api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # 流式输出关键配置
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

重点：`proxy_buffering off` 保证 SSE 流式输出不被缓冲。

## 安全加固

```bash
# 开放 443 和 80
firewall-cmd --permanent --add-port=443/tcp && firewall-cmd --permanent --add-port=80/tcp && firewall-cmd --reload

# 关闭 3000（不再直接暴露 New API）
firewall-cmd --permanent --remove-port=3000/tcp && firewall-cmd --reload
```

同时在云服务商控制台的安全组里：开放 80/443，关闭 3000。

## 踩坑记录

**坑 1：docker compose down 后重启报 iptables 错误**

```
Failed to Setup IP tables: Unable to enable SKIP DNAT rule
```

解决：先 `systemctl restart docker`，再 `docker compose up -d`。

**坑 2：New API 渠道测试报"模型价格未设置"**

不是渠道配置问题，是系统管理里模型价格没更新。去"模型价格"页面点一下更新即可。

**坑 3：流式输出断断续续**

Nginx 默认有缓冲，必须加 `proxy_buffering off` 和 `proxy_cache off`。

## 总结

整套搭下来大概 1-2 小时（大部分时间在等 DNS 生效）。最终效果：

- 一个 HTTPS 端点统一管理所有模型
- New API 后台实时看每个用户的 token 消耗
- CPA 管理认证文件，支持多账号轮询
- Cloudflare 提供 DDoS 防护和 CDN 加速
- 给团队分发令牌，设额度，再也不用直接给 key

如果你也有 token 焦虑，或者想给团队搭一个统一的 AI API 入口，这套方案够用且稳定。

---

*参考来源：[linux.do - 手把手教你搭建中转站](https://linux.do/t/topic/2140889)*
