function extractArticleHtml(html) {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|noscript|svg|nav|header|footer|aside|form|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    )
    .replace(
      /<(script|style|noscript|svg|nav|header|footer|aside|form|iframe)\b[^>]*\/?>/gi,
      "",
    );
  const candidates = [
    ...withoutNoise.matchAll(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi),
  ].map((match) => match[2]);
  const textLength = (value) =>
    value
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/\s+/g, " ")
      .trim().length;
  const content =
    candidates.sort((a, b) => textLength(b) - textLength(a))[0] ||
    withoutNoise.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] ||
    withoutNoise;

  return content
    .replace(/\s(on\w+|style|srcdoc)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .slice(0, 1_500_000);
}

export async function fetchArticleContent(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: {
      "User-Agent": "Feedwhirl/1.0 (reader)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) throw new Error(`原文网站返回 HTTP ${response.status}`);

  const contentType = response.headers.get("content-type") || "";
  if (
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml+xml")
  )
    throw new Error("原文地址不是网页内容");

  const content = extractArticleHtml(await response.text());
  if (content.replace(/<[^>]*>/g, " ").trim().length < 100)
    throw new Error("没有从原文页提取到足够的正文内容");

  return content;
}
