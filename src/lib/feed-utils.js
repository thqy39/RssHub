export function normalizeFeedUrl(url) {
  try {
    const parsed = new URL(String(url || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname)
      return null;
    if (parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host === "::1" ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    )
      return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function extractThumbnail(item) {
  if (!item) return "";
  if (
    item.enclosure &&
    typeof item.enclosure === "object" &&
    item.enclosure.url &&
    (item.enclosure.type?.startsWith("image/") ||
      /\.(avif|gif|jpe?g|png|webp)(?:$|\?)/i.test(item.enclosure.url))
  )
    return item.enclosure.url;
  if (
    item.enclosure &&
    typeof item.enclosure === "string" &&
    /\.(avif|gif|jpe?g|png|webp)(?:$|\?)/i.test(item.enclosure)
  )
    return item.enclosure;
  if (item.thumbnail && typeof item.thumbnail === "string")
    return item.thumbnail;
  if (item.thumbnail && item.thumbnail.url) return item.thumbnail.url;
  if (item.image && typeof item.image === "string") return item.image;
  if (item.media && item.media.thumbnail && item.media.thumbnail.url)
    return item.media.thumbnail.url;
  if (
    item["media:thumbnail"] &&
    typeof item["media:thumbnail"] === "object" &&
    item["media:thumbnail"].url
  )
    return item["media:thumbnail"].url;
  return "";
}

export function extractPodcastAudio(item) {
  const enclosure = item?.enclosure;
  const url = typeof enclosure === "string" ? enclosure : enclosure?.url;
  if (!url) return null;

  const normalizedUrl = normalizeFeedUrl(url);
  if (!normalizedUrl) return null;
  const parsedUrl = new URL(normalizedUrl);

  const type = typeof enclosure === "object" ? enclosure.type || "" : "";
  const isAudio =
    type.startsWith("audio/") ||
    /\.(aac|flac|m4a|mp3|oga|ogg|opus|wav)(?:$|\?)/i.test(parsedUrl.pathname);
  if (!isAudio) return null;

  return {
    url: parsedUrl.href,
    type,
    length: Number(enclosure?.length) || 0,
  };
}

export function dedupeItems(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.feedId}:${item.guid || item.link || `${item.title}:${item.isoDate || item.pubDate || ""}`}`;
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}
