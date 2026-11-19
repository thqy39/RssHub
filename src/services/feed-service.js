import Parser from "rss-parser";
import { database } from "../lib/database.js";
import {
  dedupeItems,
  extractPodcastAudio,
  extractThumbnail,
} from "../lib/feed-utils.js";

const parser = new Parser({ timeout: 15000 });

export async function refreshFeed(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    if (!Array.isArray(parsed.items))
      throw new Error("该地址没有可识别的 RSS / Atom 文章");

    const newItems = parsed.items.map((item) => {
      const audio = extractPodcastAudio(item);
      return {
        guid: String(
          item.guid ||
            item.link ||
            `${item.title || "untitled"}:${item.isoDate || item.pubDate || ""}`,
        ),
        title: item.title || "(无标题)",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || "",
        content:
          item["content:encoded"] ||
          item.content ||
          item.description ||
          item.summary ||
          item.contentSnippet ||
          "",
        contentSnippet:
          item.contentSnippet || item.summary || item.description || "",
        thumbnail: extractThumbnail(item),
        audioUrl: audio?.url || "",
        audioType: audio?.type || "",
        audioLength: audio?.length || 0,
        feedId: feed.id,
        feedTitle: parsed.title || feed.title,
        read: false,
        isoDate: item.isoDate || item.pubDate || "",
      };
    });

    const known = new Set(
      database.data.items.map(
        (item) => `${item.feedId}:${item.guid || item.link || item.title}`,
      ),
    );
    const freshItems = newItems.filter(
      (item) =>
        !known.has(`${item.feedId}:${item.guid || item.link || item.title}`),
    );

    database.data.items = dedupeItems([...database.data.items, ...freshItems]);
    if (parsed.title && feed.title === feed.url) feed.title = parsed.title;

    return { success: true, count: freshItems.length };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
