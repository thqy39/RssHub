import express from "express";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import Parser from "rss-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const parser = new Parser({ timeout: 15000 });
const db = new Low(new JSONFile(path.join(__dirname, "data.json")));

const PORT = process.env.PORT || 4000;

await db.read();
db.data ||= { feeds: [], items: [] };

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function normalizeFeedUrl(url) {
  try {
    const parsed = new URL(String(url || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) return null;
    if (parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "::1" || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractThumbnail(item) {
  if (!item) return "";
  if (item.enclosure && typeof item.enclosure === "object" && item.enclosure.url) return item.enclosure.url;
  if (item.enclosure && typeof item.enclosure === "string") return item.enclosure;
  if (item.thumbnail && typeof item.thumbnail === "string") return item.thumbnail;
  if (item.thumbnail && item.thumbnail.url) return item.thumbnail.url;
  if (item.image && typeof item.image === "string") return item.image;
  if (item.media && item.media.thumbnail && item.media.thumbnail.url) return item.media.thumbnail.url;
  if (item["media:thumbnail"] && typeof item["media:thumbnail"] === "object" && item["media:thumbnail"].url) return item["media:thumbnail"].url;
  return "";
}

function dedupeItems(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.feedId}:${item.guid || item.link || `${item.title}:${item.isoDate || item.pubDate || ""}`}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

async function refreshFeed(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    if (!Array.isArray(parsed.items)) throw new Error("该地址没有可识别的 RSS / Atom 文章");
    const newItems = parsed.items.map((item) => ({
      guid: String(item.guid || item.link || `${item.title || "untitled"}:${item.isoDate || item.pubDate || ""}`),
      title: item.title || "(无标题)",
      link: item.link || "",
      pubDate: item.pubDate || item.isoDate || "",
      content: item["content:encoded"] || item.content || item.description || item.summary || item.contentSnippet || "",
      contentSnippet: item.contentSnippet || item.summary || item.description || "",
      thumbnail: extractThumbnail(item),
      feedId: feed.id,
      feedTitle: parsed.title || feed.title,
      read: false,
      isoDate: item.isoDate || item.pubDate || ""
    }));
    const known = new Set(db.data.items.map((item) => `${item.feedId}:${item.guid || item.link || item.title}`));
    const freshItems = newItems.filter((item) => !known.has(`${item.feedId}:${item.guid || item.link || item.title}`));
    db.data.items = dedupeItems([...db.data.items, ...freshItems]);
    if (parsed.title && feed.title === feed.url) feed.title = parsed.title;
    return { success: true, count: freshItems.length };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

app.get("/api/feeds", async (req, res) => {
  await db.read();
  res.json(db.data.feeds);
});

app.post("/api/feeds", async (req, res) => {
  await db.read();
  const { url, title } = req.body;
  const normalized = normalizeFeedUrl(url);
  if (!normalized) {
    return res.status(400).json({ error: "无效的 RSS URL" });
  }
  if (db.data.feeds.find((feed) => feed.url === normalized)) {
    return res.status(409).json({ error: "该订阅已存在" });
  }

  const id = Date.now().toString();
  const feed = { id, url: normalized, title: title || normalized, createdAt: new Date().toISOString() };
  db.data.feeds.push(feed);
  await db.write();
  res.status(201).json(feed);
});

app.delete("/api/feeds/:id", async (req, res) => {
  await db.read();
  const id = req.params.id;
  db.data.feeds = db.data.feeds.filter((feed) => feed.id !== id);
  db.data.items = db.data.items.filter((item) => item.feedId !== id);
  await db.write();
  res.json({ success: true });
});

app.get("/api/items", async (req, res) => {
  await db.read();
  const { feedId, unread } = req.query;
  let items = db.data.items.slice();
  if (feedId) {
    items = items.filter((item) => item.feedId === feedId);
  }
  if (unread === "true") {
    items = items.filter((item) => !item.read);
  }
  items.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());
  res.json(items);
});

app.patch("/api/items/:guid", async (req, res) => {
  await db.read();
  const guid = req.params.guid;
  const { read } = req.body;
  const item = db.data.items.find((item) => item.guid === guid);
  if (!item) {
    return res.status(404).json({ error: "文章不存在" });
  }
  item.read = Boolean(read);
  await db.write();
  res.json(item);
});

app.post("/api/refresh", async (req, res) => {
  await db.read();
  const feed = db.data.feeds.find((item) => item.id === req.body.feedId);
  if (!feed) {
    return res.status(404).json({ error: "订阅不存在" });
  }
  const result = await refreshFeed(feed);
  await db.write();
  if (!result.success) {
    return res.status(500).json({ error: result.message });
  }
  res.json(result);
});

app.post("/api/refresh-all", async (req, res) => {
  await db.read();
  const results = [];
  for (const feed of db.data.feeds) {
    const result = await refreshFeed(feed);
    results.push({ feedId: feed.id, title: feed.title, ...result });
  }
  await db.write();
  res.json(results);
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`RSSHub 已启动: http://localhost:${PORT}`);
});
