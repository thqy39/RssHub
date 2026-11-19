import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { database } from "./lib/database.js";
import { normalizeFeedUrl } from "./lib/feed-utils.js";
import { fetchArticleContent } from "./services/article-service.js";
import { refreshFeed } from "./services/feed-service.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const publicDirectory = path.join(projectRoot, "public");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(publicDirectory));

app.get("/api/feeds", async (req, res) => {
  await database.read();
  res.json(database.data.feeds);
});

app.post("/api/feeds", async (req, res) => {
  await database.read();
  const { url, title } = req.body;
  const normalized = normalizeFeedUrl(url);
  if (!normalized) {
    return res.status(400).json({ error: "无效的 RSS URL" });
  }
  if (database.data.feeds.find((feed) => feed.url === normalized)) {
    return res.status(409).json({ error: "该订阅已存在" });
  }

  const id = Date.now().toString();
  const feed = {
    id,
    url: normalized,
    title: title || normalized,
    createdAt: new Date().toISOString(),
  };
  database.data.feeds.push(feed);
  await database.write();
  res.status(201).json(feed);
});

app.delete("/api/feeds/:id", async (req, res) => {
  await database.read();
  const id = req.params.id;
  database.data.feeds = database.data.feeds.filter((feed) => feed.id !== id);
  database.data.items = database.data.items.filter(
    (item) => item.feedId !== id,
  );
  await database.write();
  res.json({ success: true });
});

app.get("/api/items", async (req, res) => {
  await database.read();
  const { feedId, unread } = req.query;
  let items = database.data.items.slice();
  if (feedId) items = items.filter((item) => item.feedId === feedId);
  if (unread === "true") items = items.filter((item) => !item.read);
  items.sort(
    (a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime(),
  );
  res.json(items);
});

app.post("/api/items/:guid/fulltext", async (req, res) => {
  await database.read();
  const item = database.data.items.find(
    (entry) => entry.guid === req.params.guid,
  );
  if (!item) return res.status(404).json({ error: "文章不存在" });
  if (item.fullContent)
    return res.json({ content: item.fullContent, cached: true });

  const target = normalizeFeedUrl(item.link);
  if (!target)
    return res.status(400).json({ error: "文章没有可读取的网页地址" });

  try {
    item.fullContent = await fetchArticleContent(target);
    await database.write();
    res.json({ content: item.fullContent, cached: false });
  } catch (error) {
    res.status(502).json({ error: error.message || "读取原文失败" });
  }
});

app.patch("/api/items/:guid", async (req, res) => {
  await database.read();
  const guid = req.params.guid;
  const { read } = req.body;
  const item = database.data.items.find((entry) => entry.guid === guid);
  if (!item) return res.status(404).json({ error: "文章不存在" });
  item.read = Boolean(read);
  await database.write();
  res.json(item);
});

app.post("/api/refresh", async (req, res) => {
  await database.read();
  const feed = database.data.feeds.find((item) => item.id === req.body.feedId);
  if (!feed) return res.status(404).json({ error: "订阅不存在" });

  const result = await refreshFeed(feed);
  await database.write();
  if (!result.success) return res.status(500).json({ error: result.message });
  res.json(result);
});

app.post("/api/refresh-all", async (req, res) => {
  await database.read();
  const results = [];
  for (const feed of database.data.feeds) {
    const result = await refreshFeed(feed);
    results.push({ feedId: feed.id, title: feed.title, ...result });
  }
  await database.write();
  res.json(results);
});

app.get("/about/en", (req, res) => {
  res.sendFile(path.join(publicDirectory, "about-en.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(publicDirectory, "about.html"));
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(publicDirectory, "index.html"));
});

export default app;
