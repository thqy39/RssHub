# FeedWhirl

一个轻量的 RSS / Atom 聚合阅读器。订阅和文章缓存在本机，以阅读、筛选和快速更新为核心。

## 运行

1. 安装依赖

```bash
npm install
```

2. 启动服务

```bash
npm start
```

3. 打开浏览器访问

```
http://localhost:4000
```

## 功能

- 添加 / 删除订阅，支持 RSS 与 Atom
- 单源刷新、手动刷新全部，并每 15 分钟自动刷新（页面打开且处于前台时）
- 全文预览、原文跳转、未读计数、单篇及批量标记已读
- 按订阅源和未读状态筛选，搜索标题与摘要
- OPML 订阅导入与导出，便于从其他阅读器迁移或备份订阅清单
- 订阅和文章缓存保存在本机 `data.json`

## 开发说明

- `server.js` 是兼容入口，继续支持 `node server.js` 和现有 PM2 启动方式
- `src/server.js` 启动 HTTP 服务，`src/app.js` 定义 API 和静态文件路由
- `src/lib/` 放数据库和通用工具，`src/services/` 放订阅刷新、全文读取等业务逻辑
- `public/index.html` 是页面结构；样式、界面逻辑和精选源数据分别位于 `public/assets/css/` 与 `public/assets/js/`
- `data.json` 保留在项目根目录，保存本机订阅、文章和阅读状态；它不会随代码结构调整而迁移，建议定期备份。OPML 只包含订阅清单。
- `docs/legacy/` 保存旧的 RSS 调试样本，不参与运行。
