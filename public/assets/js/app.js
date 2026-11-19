import { curatedGroups, curatedFeeds } from "./curated-feeds.js";

const state = {
  feeds: [],
  items: [],
  view: "all",
  feedId: "",
  selected: "",
  busy: false,
  feedManagerQuery: "",
  catalogCategory: "全部",
  selectedCurated: new Set(),
  language: localStorage.getItem("jaspers-rss-language") === "en" ? "en" : "zh",
};
const $ = (id) => document.getElementById(id);
const translations = {
  你的安静阅读空间: "Your quiet reading space",
  全部文章: "All articles",
  未读: "Unread",
  精选订阅源: "Discover feeds",
  "100 个海内外优质来源": "100 quality feeds from around the world",
  订阅源: "Subscriptions",
  "管理 →": "Manage →",
  "添加 RSS / Atom 订阅": "Add an RSS / Atom feed",
  添加订阅: "Add a feed",
  添加: "Add",
  "导出 OPML": "Export OPML",
  "导入 OPML": "Import OPML",
  "本地保存 · 标准 RSS 与 Atom": "Self-hosted · RSS and Atom",
  文章筛选: "Article filters",
  将当前筛选中的文章全部标为已读: "Mark all visible articles as read",
  全部已读: "Mark all read",
  刷新全部订阅: "Refresh all feeds",
  "搜索文章标题或摘要…": "Search article titles or summaries…",
  搜索文章: "Search articles",
  "正在读取订阅…": "Loading subscriptions…",
  "选一篇文章，开始阅读": "Choose an article to start reading",
  "订阅更新会安静地汇集在这里。":
    "Your subscriptions will appear here, ready to read.",
  关闭: "Close",
  发现值得订阅的内容: "Find something worth following",
  "精选海内外来源，添加到你的阅读空间。":
    "Explore quality sources and add them to your reader.",
  "搜索来源、主题或分类…": "Search sources, topics, or categories…",
  搜索精选源: "Search recommended feeds",
  选择当前结果: "Select visible",
  取消选择当前结果: "Deselect visible",
  清空: "Clear",
  添加已选来源: "Add selected feeds",
  管理订阅源: "Manage subscriptions",
  "搜索订阅源…": "Search subscriptions…",
  搜索已订阅来源: "Search subscribed feeds",
  刷新此订阅: "Refresh this feed",
  移除订阅: "Remove subscription",
  没有匹配的订阅源: "No matching subscriptions",
  "还没有订阅源，添加 RSS 地址开始阅读。":
    "No subscriptions yet. Add an RSS feed to get started.",
  "没有找到匹配的来源，试试其他关键词或分类。":
    "No matching sources. Try another search or category.",
  已订阅: "Added",
  "＋ 添加": "+ Add",
  标为未读: "Mark unread",
  标为已读: "Mark read",
  "← 返回列表": "← Back to list",
  退出专注: "Exit focus mode",
  "专注阅读 ⛶": "Focus mode ⛶",
  在软件内加载全文: "Load full article",
  "正在软件内加载全文…": "Loading full article…",
  重试加载全文: "Retry loading full article",
  "订阅源没有提供正文内容。": "This feed does not include the full article.",
  "订阅源只提供摘要。正在尝试在软件内读取原文全文…":
    "Only a summary is available. Trying to load the full article…",
  "（无标题）": "(Untitled)",
  暂无摘要: "No summary available",
  "没有找到匹配的文章。": "No matching articles found.",
  "这里暂时没有文章，试试刷新订阅。":
    "No articles yet. Try refreshing your feeds.",
  "还没有订阅源。添加一个 RSS 或 Atom 地址，文章就会汇集到这里。":
    "No subscriptions yet. Add an RSS or Atom feed to collect articles here.",
  当前没有未读文章: "There are no unread articles",
  订阅已移除: "Subscription removed",
  请求失败: "Request failed",
  全部: "All",
  "AI 与前沿科技": "AI & Emerging Tech",
  "AI 模型、研究与产业动态": "AI models, research, and industry news",
  开发与开源: "Development & Open Source",
  "工程实践、开发工具和开源项目":
    "Engineering, developer tools, and open source",
  数码与产品评测: "Tech & Product Reviews",
  "消费电子、手机电脑和深度体验":
    "Consumer tech, devices, and hands-on reviews",
  创业与新产品: "Startups & New Products",
  "创业公司、创意产品和商业趋势": "Startups, new ideas, and business trends",
  股票与金融: "Markets & Finance",
  "市场、商业、个人理财和宏观经济":
    "Markets, business, personal finance, and the economy",
  全球优质新闻: "World News",
  "国际新闻、深度报道与公共议题":
    "International news, long reads, and public affairs",
  中文科技与商业: "Chinese Tech & Business",
  "中文互联网、科技公司和产业观察":
    "Chinese internet, technology, and industry coverage",
  科学与研究: "Science & Research",
  "科学发现、学术论文和太空探索": "Discoveries, research papers, and space",
  设计与创意: "Design & Ideas",
  "设计灵感、文化评论和创作者视角":
    "Design, culture, and creative perspectives",
  安全与隐私: "Security & Privacy",
  "网络安全、漏洞响应与数字权利":
    "Cybersecurity, vulnerabilities, and digital rights",
};
const localizedTextNodes = [];
const textWalker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
);
while (textWalker.nextNode()) {
  const node = textWalker.currentNode;
  if (!node.parentElement.closest("script, style"))
    localizedTextNodes.push({ node, original: node.nodeValue });
}
const localizedAttributes = [];
document
  .querySelectorAll("[placeholder], [aria-label], [title]")
  .forEach((element) => {
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      if (element.hasAttribute(attribute))
        localizedAttributes.push({
          element,
          attribute,
          original: element.getAttribute(attribute),
        });
    }
  });
function t(text) {
  return state.language === "en" ? translations[text] || text : text;
}
function feedCountText(count) {
  return state.language === "en"
    ? `${count} ${count === 1 ? "feed" : "feeds"}`
    : `${count} 个来源`;
}
function applyLanguage() {
  for (const { node, original } of localizedTextNodes) {
    const text = original.trim();
    if (!text) continue;
    const leading = original.length - original.trimStart().length;
    const trailing = original.length - original.trimEnd().length;
    node.nodeValue = `${original.slice(0, leading)}${t(text)}${trailing ? original.slice(-trailing) : ""}`;
  }
  for (const { element, attribute, original } of localizedAttributes)
    element.setAttribute(attribute, t(original));
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
  document.title =
    state.language === "en" ? "Jasper's RSS · Reader" : "Jasper's RSS · 阅读器";
  $("languageToggle").textContent = state.language === "en" ? "中文" : "EN";
  $("languageToggle").setAttribute(
    "aria-label",
    state.language === "en" ? "Switch language" : "切换语言",
  );
  $("languageToggle").title =
    state.language === "en" ? "Switch language" : "切换语言";
}
async function api(path, method = "GET", body) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) options.body = JSON.stringify(body);
  const response = await fetch(path, options);
  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) throw new Error(data.error || t("请求失败"));
  return data;
}
function toast(message) {
  const node = $("toast");
  node.textContent = localizeMessage(message);
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2600);
}
function localizeMessage(message) {
  if (state.language !== "en") return message;
  if (translations[message]) return translations[message];
  const patterns = [
    [
      /^已新增 (\d+) 篇，(\d+) 个订阅刷新失败$/,
      (_, count, failed) =>
        `Added ${count} articles; ${failed} feeds failed to refresh`,
    ],
    [
      /^刷新完成，新增 (\d+) 篇文章$/,
      (_, count) => `Refresh complete · ${count} new articles`,
    ],
    [/^刷新失败：(.*)$/, (_, error) => `Refresh failed: ${error}`],
    [
      /^已将 (\d+) 篇文章标为已读$/,
      (_, count) => `Marked ${count} articles as read`,
    ],
    [
      /^更新失败：(.*)，请重试$/,
      (_, error) => `Update failed: ${error}. Please try again.`,
    ],
    [/^已导出 (\d+) 个订阅$/, (_, count) => `Exported ${count} feeds`],
    [
      /^OPML 导入完成：新增 (\d+) 个，跳过 (\d+) 个$/,
      (_, added, skipped) =>
        `OPML import complete: ${added} added, ${skipped} skipped`,
    ],
    [/^导入失败：(.*)$/, (_, error) => `Import failed: ${error}`],
    [/^已新增 (\d+) 篇文章$/, (_, count) => `${count} new articles`],
  ];
  for (const [pattern, format] of patterns) {
    const match = message.match(pattern);
    if (match) return format(...match);
  }
  return message;
}
function date(value) {
  if (!value) return state.language === "en" ? "Time unknown" : "时间未知";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? state.language === "en"
      ? "Time unknown"
      : "时间未知"
    : new Intl.DateTimeFormat(state.language === "en" ? "en-US" : "zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(parsed);
}
function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
function cleanHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  doc
    .querySelectorAll("script,style,form,object,embed,meta,link,base")
    .forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const key = attr.name.toLowerCase();
      if (key.startsWith("on") || key === "srcdoc")
        node.removeAttribute(attr.name);
      if (key === "href" || key === "xlink:href")
        node.removeAttribute(attr.name);
      if (key === "src") {
        const safe = safeUrl(attr.value);
        if (!safe) node.removeAttribute(attr.name);
        else node.setAttribute(attr.name, safe);
      }
    });
    if (node.tagName === "A") {
      node.removeAttribute("href");
      node.setAttribute("role", "text");
    }
    if (node.tagName === "IFRAME") {
      const src = safeUrl(node.getAttribute("src"));
      if (!src) {
        node.remove();
        return;
      }
      node.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-presentation",
      );
      node.setAttribute("loading", "lazy");
    }
  });
  return doc.body.innerHTML;
}
function visibleItems() {
  const needle = $("search").value.trim().toLocaleLowerCase();
  return state.items
    .filter(
      (item) =>
        (!state.feedId || item.feedId === state.feedId) &&
        (state.view !== "unread" || !item.read) &&
        (!needle ||
          `${item.title} ${item.contentSnippet || ""} ${item.feedTitle || ""}`
            .toLocaleLowerCase()
            .includes(needle)),
    )
    .sort(
      (a, b) =>
        new Date(b.isoDate || b.pubDate || 0) -
        new Date(a.isoDate || a.pubDate || 0),
    );
}
function renderFeeds() {
  const roots = [$("feedList"), $("mobileFeedList")];
  const allUnread = state.items.filter((item) => !item.read);
  $("allCount").textContent = state.items.length || "";
  $("unreadCount").textContent = allUnread.length || "";
  $("mobileFeedCount").textContent = feedCountText(state.feeds.length);
  $("feedManagerCount").textContent =
    state.language === "en"
      ? `${feedCountText(state.feeds.length)} · ${allUnread.length} unread`
      : `${feedCountText(state.feeds.length)} · ${allUnread.length} 篇未读`;
  for (const root of roots) {
    root.replaceChildren();
    const feeds =
      root.id === "mobileFeedList"
        ? state.feeds.filter((feed) =>
            `${feed.title || ""} ${feed.url}`
              .toLocaleLowerCase()
              .includes(state.feedManagerQuery),
          )
        : state.feeds;
    if (root.id === "mobileFeedList" && !feeds.length) {
      const empty = document.createElement("li");
      empty.className = "feed-manager-empty";
      empty.textContent = state.feeds.length
        ? t("没有匹配的订阅源")
        : t("还没有订阅源，添加 RSS 地址开始阅读。");
      root.append(empty);
    }
    for (const feed of feeds) {
      const li = document.createElement("li"),
        button = document.createElement("button"),
        dot = document.createElement("span"),
        name = document.createElement("span"),
        count = document.createElement("span"),
        controls = document.createElement("span"),
        refreshButton = document.createElement("button"),
        remove = document.createElement("button");
      button.type = "button";
      button.className = `feed-button ${state.feedId === feed.id ? "active" : ""}`;
      dot.className = "feed-dot";
      name.className = "feed-name";
      name.textContent = feed.title || feed.url;
      count.className = "count";
      const n = state.items.filter(
        (item) => item.feedId === feed.id && !item.read,
      ).length;
      count.textContent = n || "";
      controls.className = "feed-controls";
      refreshButton.type = "button";
      refreshButton.className = "feed-refresh";
      refreshButton.textContent = "↻";
      refreshButton.title = t("刷新此订阅");
      refreshButton.setAttribute(
        "aria-label",
        `刷新 ${feed.title || feed.url}`,
      );
      refreshButton.addEventListener("click", (event) => {
        event.stopPropagation();
        refreshFeed(feed.id, refreshButton);
      });
      remove.type = "button";
      remove.className = "feed-remove";
      remove.textContent = "×";
      remove.title = t("移除订阅");
      remove.setAttribute("aria-label", `移除 ${feed.title || feed.url}`);
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteFeed(feed.id);
      });
      controls.append(refreshButton, remove);
      button.append(dot, name, count, controls);
      button.addEventListener("click", () => {
        state.feedId = state.feedId === feed.id ? "" : feed.id;
        if (root.id === "mobileFeedList") $("feedManagerDialog").close();
        render();
      });
      li.append(button);
      root.append(li);
    }
  }
  $("feedList").hidden = !state.feeds.length;
}
function normalizedFeedUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.pathname = url.pathname.replace(/\/$/, "");
    return url.href;
  } catch {
    return value;
  }
}
function visibleCurated() {
  const query = $("catalogSearch").value.trim().toLocaleLowerCase();
  return curatedFeeds.filter((feed) => {
    const matchesCategory =
      state.catalogCategory === "全部" ||
      feed.category === state.catalogCategory;
    const matchesSearch =
      !query ||
      `${feed.title} ${feed.url} ${feed.category} ${t(feed.category)} ${feed.description} ${t(feed.description)}`
        .toLocaleLowerCase()
        .includes(query);
    return matchesCategory && matchesSearch;
  });
}
function renderCatalogCategories() {
  const root = $("catalogCategories");
  root.replaceChildren();
  const categories = ["全部", ...curatedGroups.map(([category]) => category)];
  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `catalog-category ${state.catalogCategory === category ? "active" : ""}`;
    button.textContent =
      category === "全部"
        ? `${t("全部")} ${curatedFeeds.length}`
        : `${t(category)} ${curatedFeeds.filter((feed) => feed.category === category).length}`;
    button.addEventListener("click", () => {
      state.catalogCategory = category;
      renderCurated();
    });
    root.append(button);
  }
}
function renderCurated() {
  renderCatalogCategories();
  const root = $("curatedList");
  const feeds = visibleCurated();
  const subscribed = new Set(
    state.feeds.map((feed) => normalizedFeedUrl(feed.url)),
  );
  root.replaceChildren();
  $("catalogCount").textContent =
    state.language === "en"
      ? `${feeds.length} ${feeds.length === 1 ? "source" : "sources"}${state.catalogCategory === "全部" ? "" : ` · ${t(state.catalogCategory)}`}`
      : `${feeds.length} 个来源${state.catalogCategory === "全部" ? "" : ` · ${state.catalogCategory}`}`;
  for (const feed of feeds) {
    const isSubscribed = subscribed.has(normalizedFeedUrl(feed.url));
    if (isSubscribed) state.selectedCurated.delete(feed.url);
    const row = document.createElement("article");
    row.className = `curated-card ${isSubscribed ? "subscribed" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "curated-check";
    checkbox.checked = state.selectedCurated.has(feed.url);
    checkbox.disabled = isSubscribed;
    checkbox.setAttribute("aria-label", `选择 ${feed.title}`);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.selectedCurated.add(feed.url);
      else state.selectedCurated.delete(feed.url);
      updateCatalogSelection();
    });
    const copy = document.createElement("div");
    copy.className = "curated-copy";
    const mark = document.createElement("span");
    mark.className = "curated-mark";
    mark.textContent = /^[a-z0-9]/i.test(feed.title)
      ? feed.title.slice(0, 2).toUpperCase()
      : feed.title.slice(0, 1);
    let hue = 0;
    for (const character of feed.title)
      hue = (hue * 31 + character.charCodeAt(0)) % 360;
    mark.style.setProperty("--mark-hue", `${hue}deg`);
    const name = document.createElement("div");
    name.className = "curated-name";
    name.textContent = feed.title;
    const category = document.createElement("div");
    category.className = "curated-category";
    category.textContent = t(feed.category);
    const description = document.createElement("div");
    description.className = "curated-description";
    description.textContent = t(feed.description);
    const domain = document.createElement("div");
    domain.className = "curated-domain";
    domain.textContent = new URL(feed.url).hostname;
    copy.append(name, category, description, domain);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "curated-add";
    button.textContent = isSubscribed ? t("已订阅") : t("＋ 添加");
    button.disabled = isSubscribed;
    button.addEventListener("click", () => addCurated(feed, button));
    row.append(checkbox, mark, copy, button);
    root.append(row);
  }
  if (!feeds.length) {
    const empty = document.createElement("div");
    empty.className = "catalog-empty";
    empty.textContent = t("没有找到匹配的来源，试试其他关键词或分类。");
    root.append(empty);
  }
  updateCatalogSelection();
}
function updateCatalogSelection() {
  const available = new Set(
    state.feeds.map((feed) => normalizedFeedUrl(feed.url)),
  );
  const selected = [...state.selectedCurated].filter(
    (url) => !available.has(normalizedFeedUrl(url)),
  );
  state.selectedCurated = new Set(selected);
  $("selectedCount").textContent =
    state.language === "en"
      ? `${selected.length} selected`
      : `已选 ${selected.length} 个`;
  $("addSelected").disabled = !selected.length;
  const visible = visibleCurated().filter(
    (feed) => !available.has(normalizedFeedUrl(feed.url)),
  );
  const allSelected =
    visible.length > 0 &&
    visible.every((feed) => state.selectedCurated.has(feed.url));
  $("selectVisible").textContent = t(
    allSelected ? "取消选择当前结果" : "选择当前结果",
  );
}
function renderList() {
  const list = visibleItems(),
    root = $("items");
  const feed = state.feeds.find((item) => item.id === state.feedId);
  $("listTitle").textContent =
    feed?.title ||
    (state.view === "unread"
      ? state.language === "en"
        ? "Unread articles"
        : "未读文章"
      : t("全部文章"));
  $("listSub").textContent =
    state.language === "en"
      ? `${list.length} ${list.length === 1 ? "article" : "articles"}${state.view === "unread" ? " · Unread only" : ""}`
      : `${list.length} 篇文章${state.view === "unread" ? " · 只显示未读" : ""}`;
  root.replaceChildren();
  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "list-empty";
    empty.textContent = state.feeds.length
      ? $("search").value
        ? t("没有找到匹配的文章。")
        : t("这里暂时没有文章，试试刷新订阅。")
      : t("还没有订阅源。添加一个 RSS 或 Atom 地址，文章就会汇集到这里。");
    root.append(empty);
    return;
  }
  for (const item of list) {
    const button = document.createElement("article");
    button.className = `article ${item.read ? "" : "unread"} ${state.selected === item.guid ? "selected" : ""}`;
    button.tabIndex = 0;
    button.setAttribute("role", "button");
    button.setAttribute("aria-label", item.title || "打开文章");
    const source = document.createElement("div");
    source.className = "article-source";
    const glyph = document.createElement("span");
    glyph.className = "source-glyph";
    glyph.textContent = (item.feedTitle || "R").trim().slice(0, 1);
    const sourceName = document.createElement("span");
    sourceName.textContent = item.feedTitle || "订阅源";
    const time = document.createElement("time");
    time.textContent = date(item.pubDate || item.isoDate);
    source.append(glyph, sourceName, time);
    const title = document.createElement("h3");
    title.textContent = item.title || t("（无标题）");
    const summary = document.createElement("p");
    summary.textContent =
      (item.contentSnippet || item.content || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim() || t("暂无摘要");
    button.append(source, title, summary);
    const open = () => selectItem(item.guid);
    button.addEventListener("click", open);
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    root.append(button);
  }
}
function renderReader() {
  const root = $("reader"),
    item = state.items.find((entry) => entry.guid === state.selected);
  root.replaceChildren();
  if (!item) {
    const empty = document.createElement("div");
    empty.className = "reader-empty";
    empty.innerHTML = `<div class="empty-icon">⌁</div><strong>${t("选一篇文章，开始阅读")}</strong><span>${t("订阅更新会安静地汇集在这里。")}</span>`;
    root.append(empty);
    return;
  }
  const top = document.createElement("div");
  top.className = "reader-top";
  const back = document.createElement("button");
  back.className = "reader-back";
  back.type = "button";
  back.textContent = t("← 返回列表");
  back.addEventListener("click", () =>
    document.body.classList.remove("mobile-reader-open"),
  );
  const source = document.createElement("span");
  source.textContent = item.feedTitle || "订阅源";
  top.append(back, source);
  const title = document.createElement("h2");
  title.textContent = item.title || t("（无标题）");
  const meta = document.createElement("div");
  meta.className = "reader-meta";
  const time = document.createElement("time");
  time.textContent = date(item.pubDate || item.isoDate);
  const actions = document.createElement("div");
  actions.className = "reader-actions";
  const focus = document.createElement("button");
  focus.className = "focus-toggle";
  focus.textContent = document.body.classList.contains("focus-mode")
    ? t("退出专注")
    : t("专注阅读 ⛶");
  focus.setAttribute(
    "aria-pressed",
    String(document.body.classList.contains("focus-mode")),
  );
  focus.addEventListener("click", toggleFocus);
  const mark = document.createElement("button");
  mark.className = "text-button";
  mark.textContent = item.read ? t("标为未读") : t("标为已读");
  mark.addEventListener("click", () => toggleRead(item));
  actions.append(focus, mark);
  meta.append(time, actions);
  const body = document.createElement("div");
  body.className = "reader-body";
  const content = item.fullContent || item.content || item.contentSnippet || "";
  const hasMoreLink =
    /查看全文|阅读全文|继续阅读|阅读原文|read\s+more|continue\s+reading/i.test(
      String(content).replace(/<[^>]*>/g, " "),
    );
  body.innerHTML = cleanHtml(content || "订阅源没有提供正文内容。");
  if (!item.fullContent && hasMoreLink) {
    const action = document.createElement("button");
    action.className = "text-button";
    action.textContent = item.fullTextLoading
      ? t("正在软件内加载全文…")
      : item.fullTextError
        ? t("重试加载全文")
        : t("在软件内加载全文");
    action.disabled = Boolean(item.fullTextLoading);
    action.addEventListener("click", () => {
      item.fullTextError = "";
      fetchFullText(item);
    });
    body.append(action);
    if (!item.fullTextLoading && !item.fullTextError && !item.fullTextAttempted)
      fetchFullText(item);
    else if (item.fullTextError) {
      const note = document.createElement("p");
      note.textContent =
        state.language === "en"
          ? `Could not load the full article: ${item.fullTextError}`
          : `暂时无法获取全文：${item.fullTextError}`;
      body.append(note);
    }
  } else if (
    !item.fullContent &&
    (!item.content || item.content === item.contentSnippet)
  ) {
    const notice = document.createElement("p");
    notice.textContent = item.fullTextError
      ? state.language === "en"
        ? `Could not load the full article: ${item.fullTextError}`
        : `暂时无法获取全文：${item.fullTextError}`
      : t("订阅源只提供摘要。正在尝试在软件内读取原文全文…");
    body.append(notice);
    if (!item.fullTextError && !item.fullTextLoading && !item.fullTextAttempted)
      fetchFullText(item);
  }
  root.append(top, title, meta, body);
}
function render() {
  document
    .querySelectorAll("[data-view]")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.view === state.view),
    );
  renderFeeds();
  renderCurated();
  renderList();
  renderReader();
}
function toggleFocus() {
  document.body.classList.toggle("focus-mode");
  const active = document.body.classList.contains("focus-mode");
  if (active) history.pushState({ focus: true }, "");
  renderReader();
}
function showLoading() {
  const list = $("items"),
    reader = $("reader");
  list.classList.add("is-loading");
  reader.classList.add("is-loading");
  if (!state.items.length) {
    list.innerHTML = Array.from(
      { length: 5 },
      () =>
        '<div class="skeleton"><div class="skeleton-line short"></div><div class="skeleton-line title"></div><div class="skeleton-line summary"></div></div>',
    ).join("");
    reader.innerHTML =
      '<div class="reader-skeleton"><div class="skeleton-line short"></div><div class="skeleton-line title"></div><div class="skeleton-line summary"></div><div class="skeleton-line summary"></div><div class="skeleton-line summary"></div><div class="skeleton-line summary"></div><div class="skeleton-line summary"></div></div>';
  }
}
function hideLoading() {
  document
    .querySelectorAll(".is-loading")
    .forEach((node) => node.classList.remove("is-loading"));
}
async function load() {
  showLoading();
  try {
    const [feeds, items] = await Promise.all([
      api("/api/feeds"),
      api("/api/items"),
    ]);
    state.feeds = feeds;
    state.items = items;
    if (state.selected && !items.some((item) => item.guid === state.selected))
      state.selected = "";
    render();
  } catch (error) {
    toast(error.message);
  } finally {
    hideLoading();
  }
}
function selectItem(guid) {
  state.selected = guid;
  if (window.matchMedia("(max-width: 760px)").matches)
    document.body.classList.add("mobile-reader-open");
  const item = state.items.find((entry) => entry.guid === guid);
  if (item && !item.read) toggleRead(item, true);
  else render();
}
async function fetchFullText(item) {
  item.fullTextLoading = true;
  item.fullTextAttempted = true;
  try {
    const result = await api(
      `/api/items/${encodeURIComponent(item.guid)}/fulltext`,
      "POST",
      {},
    );
    item.fullContent = result.content;
    item.fullTextError = "";
  } catch (error) {
    item.fullTextError = error.message;
  } finally {
    item.fullTextLoading = false;
    if (state.selected === item.guid) renderReader();
  }
}
async function toggleRead(item, read) {
  try {
    await api(`/api/items/${encodeURIComponent(item.guid)}`, "PATCH", {
      read,
    });
    item.read = read;
    render();
  } catch (error) {
    toast(error.message);
  }
}
async function deleteFeed(id) {
  if (
    !confirm(
      state.language === "en"
        ? "Remove this feed and its cached articles?"
        : "移除此订阅及其已缓存文章？",
    )
  )
    return;
  try {
    await api(`/api/feeds/${encodeURIComponent(id)}`, "DELETE");
    if (state.feedId === id) state.feedId = "";
    state.selected = "";
    await load();
    toast(t("订阅已移除"));
  } catch (error) {
    toast(error.message);
  }
}
async function refreshFeed(id, button) {
  if (state.busy) return;
  state.busy = true;
  if (button) button.disabled = true;
  $("items").classList.add("is-loading");
  try {
    const result = await api("/api/refresh", "POST", { feedId: id });
    await load();
    toast(
      result.count
        ? state.language === "en"
          ? `Feed updated · ${result.count} new articles`
          : `订阅已更新，新增 ${result.count} 篇文章`
        : state.language === "en"
          ? "Already up to date"
          : "已是最新，没有新文章",
    );
  } catch (error) {
    toast(
      state.language === "en"
        ? `Refresh failed: ${error.message}`
        : `刷新失败：${error.message}`,
    );
  } finally {
    state.busy = false;
    if (button) button.disabled = false;
    hideLoading();
  }
}
async function addCurated(feed, button) {
  button.disabled = true;
  button.textContent = state.language === "en" ? "Adding…" : "添加中…";
  try {
    const added = await api("/api/feeds", "POST", {
      url: feed.url,
      title: feed.title,
    });
    await load();
    try {
      const result = await api("/api/refresh", "POST", {
        feedId: added.id,
      });
      await load();
      toast(
        result.count
          ? state.language === "en"
            ? `Added ${feed.title} · ${result.count} new articles`
            : "已添加 " + feed.title + "，更新 " + result.count + " 篇文章"
          : state.language === "en"
            ? `Added ${feed.title}`
            : "已添加 " + feed.title,
      );
    } catch (error) {
      toast(
        state.language === "en"
          ? `Added ${feed.title}, but refresh failed: ${error.message}`
          : feed.title + " 已添加，暂时无法刷新：" + error.message,
      );
    }
  } catch (error) {
    toast(error.message);
    button.disabled = false;
    button.textContent = t("＋ 添加");
  }
}
async function addSelectedCurated() {
  const button = $("addSelected");
  const urls = [...state.selectedCurated];
  if (!urls.length || state.busy) return;
  state.busy = true;
  button.disabled = true;
  button.textContent = state.language === "en" ? "Adding…" : "正在添加…";
  let added = 0;
  let failed = 0;
  try {
    for (const url of urls) {
      const feed = curatedFeeds.find((entry) => entry.url === url);
      if (!feed) continue;
      try {
        await api("/api/feeds", "POST", {
          url: feed.url,
          title: feed.title,
        });
        added++;
      } catch {
        failed++;
      }
      button.textContent =
        state.language === "en"
          ? `Adding ${added + failed}/${urls.length}…`
          : `正在添加 ${added + failed}/${urls.length}…`;
    }
    state.selectedCurated.clear();
    await load();
    if (added) {
      toast(
        state.language === "en"
          ? `Added ${added} feeds. Refresh to load articles${failed ? `; ${failed} failed` : ""}`
          : `已添加 ${added} 个来源，点击刷新按钮即可读取文章${failed ? `；${failed} 个添加失败` : ""}`,
      );
    } else {
      toast(
        state.language === "en"
          ? failed
            ? `Could not add ${failed} feeds. Please try again.`
            : "No new feeds were added"
          : failed
            ? `添加失败 ${failed} 个，请稍后重试`
            : "没有新增来源",
      );
    }
  } catch (error) {
    toast(
      state.language === "en"
        ? `Bulk add stopped: ${error.message}`
        : `批量添加中断：${error.message}`,
    );
  } finally {
    state.busy = false;
    button.textContent = t("添加已选来源");
    updateCatalogSelection();
  }
}
$("openCatalog").addEventListener("click", () => {
  state.catalogCategory = "全部";
  $("catalogSearch").value = "";
  renderCurated();
  $("catalogDialog").showModal();
});
$("closeCatalog").addEventListener("click", () => $("catalogDialog").close());
$("catalogDialog").addEventListener("click", (event) => {
  if (event.target === $("catalogDialog")) $("catalogDialog").close();
});
$("catalogSearch").addEventListener("input", renderCurated);
$("selectVisible").addEventListener("click", () => {
  const existing = new Set(
    state.feeds.map((feed) => normalizedFeedUrl(feed.url)),
  );
  const visible = visibleCurated().filter(
    (feed) => !existing.has(normalizedFeedUrl(feed.url)),
  );
  const allSelected =
    visible.length &&
    visible.every((feed) => state.selectedCurated.has(feed.url));
  for (const feed of visible) {
    if (allSelected) state.selectedCurated.delete(feed.url);
    else state.selectedCurated.add(feed.url);
  }
  renderCurated();
});
$("clearSelection").addEventListener("click", () => {
  state.selectedCurated.clear();
  $("selectVisible").textContent = t("选择当前结果");
  renderCurated();
});
$("addSelected").addEventListener("click", addSelectedCurated);
$("openFeedManager").addEventListener("click", () => {
  state.feedManagerQuery = "";
  $("feedManagerSearch").value = "";
  renderFeeds();
  $("feedManagerDialog").showModal();
});
$("closeFeedManager").addEventListener("click", () =>
  $("feedManagerDialog").close(),
);
$("feedManagerSearch").addEventListener("input", (event) => {
  state.feedManagerQuery = event.target.value.trim().toLocaleLowerCase();
  renderFeeds();
});
$("feedManagerDialog").addEventListener("click", (event) => {
  if (event.target === $("feedManagerDialog")) $("feedManagerDialog").close();
});
const mobileViewport = window.matchMedia("(max-width: 760px)");
function placeAddForm() {
  const destination = mobileViewport.matches
    ? $("addDialogSlot")
    : $("addFormHome");
  destination.append($("addForm"));
}
placeAddForm();
mobileViewport.addEventListener("change", placeAddForm);
$("openAddDialog").addEventListener("click", () =>
  $("addFeedDialog").showModal(),
);
$("closeAddDialog").addEventListener("click", () => $("addFeedDialog").close());
$("addFeedDialog").addEventListener("click", (event) => {
  if (event.target === $("addFeedDialog")) $("addFeedDialog").close();
});
async function refresh() {
  if (state.busy) return;
  state.busy = true;
  $("refreshButton").disabled = true;
  $("refreshButton").textContent = "…";
  document.body.classList.add("feed-refreshing");
  $("items").classList.add("is-loading");
  try {
    const results = await api("/api/refresh-all", "POST", {});
    await load();
    const failed = results.filter((item) => !item.success);
    const added = results.reduce((sum, item) => sum + (item.count || 0), 0);
    toast(
      failed.length
        ? state.language === "en"
          ? `Added ${added} articles; ${failed.length} feeds failed to refresh`
          : `已新增 ${added} 篇，${failed.length} 个订阅刷新失败`
        : state.language === "en"
          ? `Refresh complete · ${added} new articles`
          : `刷新完成，新增 ${added} 篇文章`,
    );
  } catch (error) {
    toast(
      state.language === "en"
        ? `Refresh failed: ${error.message}`
        : `刷新失败：${error.message}`,
    );
  } finally {
    state.busy = false;
    $("refreshButton").disabled = false;
    $("refreshButton").textContent = "↻";
    document.body.classList.remove("feed-refreshing");
    hideLoading();
  }
}
async function markVisibleRead() {
  const unread = visibleItems().filter((item) => !item.read);
  if (!unread.length) {
    toast(
      state.language === "en"
        ? "There are no unread articles"
        : "当前没有未读文章",
    );
    return;
  }
  const button = $("markAllButton");
  button.disabled = true;
  try {
    await Promise.all(
      unread.map((item) =>
        api(`/api/items/${encodeURIComponent(item.guid)}`, "PATCH", {
          read: true,
        }),
      ),
    );
    unread.forEach((item) => (item.read = true));
    render();
    toast(
      state.language === "en"
        ? `Marked ${unread.length} articles as read`
        : `已将 ${unread.length} 篇文章标为已读`,
    );
  } catch (error) {
    toast(
      state.language === "en"
        ? `Update failed: ${error.message}. Please try again.`
        : `更新失败：${error.message}，请重试`,
    );
    await load();
  } finally {
    button.disabled = false;
  }
}
function exportOpml() {
  const escape = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;");
  const rows = state.feeds
    .map(
      (feed) =>
        `    <outline text="${escape(feed.title)}" title="${escape(feed.title)}" type="rss" xmlUrl="${escape(feed.url)}"/>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0"><head><title>Jasper's RSS subscriptions</title></head><body>\n${rows}\n</body></opml>`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([xml], { type: "text/xml;charset=utf-8" }),
  );
  link.download = "jasper-rss-subscriptions.opml";
  link.click();
  URL.revokeObjectURL(link.href);
  toast(
    state.language === "en"
      ? `Exported ${state.feeds.length} feeds`
      : `已导出 ${state.feeds.length} 个订阅`,
  );
}
async function importOpml(file) {
  if (!file) return;
  try {
    const xml = new DOMParser().parseFromString(
      await file.text(),
      "application/xml",
    );
    if (
      xml.querySelector("parsererror") ||
      xml.documentElement.tagName.toLowerCase() !== "opml"
    )
      throw new Error(
        state.language === "en"
          ? "This is not a valid OPML file"
          : "文件不是有效的 OPML",
      );
    const nodes = [...xml.querySelectorAll("outline[xmlUrl]")];
    let added = 0,
      skipped = 0;
    for (const node of nodes) {
      try {
        await api("/api/feeds", "POST", {
          url: node.getAttribute("xmlUrl"),
          title: node.getAttribute("title") || node.getAttribute("text") || "",
        });
        added++;
      } catch {
        skipped++;
      }
    }
    await load();
    if (added) await refresh();
    toast(
      state.language === "en"
        ? `OPML import complete: ${added} added, ${skipped} skipped`
        : `OPML 导入完成：新增 ${added} 个，跳过 ${skipped} 个`,
    );
  } catch (error) {
    toast(
      state.language === "en"
        ? `Import failed: ${error.message}`
        : `导入失败：${error.message}`,
    );
  } finally {
    $("opmlFile").value = "";
  }
}
$("addForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("feedUrl"),
    button = $("addButton"),
    url = input.value.trim();
  if (!url) return;
  button.disabled = true;
  button.textContent = "…";
  try {
    const feed = await api("/api/feeds", "POST", { url });
    input.value = "";
    if ($("addFeedDialog").open) $("addFeedDialog").close();
    await load();
    await api("/api/refresh", "POST", { feedId: feed.id }).catch((error) =>
      toast(
        state.language === "en"
          ? `Feed added, but the first refresh failed: ${error.message}`
          : `已添加订阅，首次拉取失败：${error.message}`,
      ),
    );
    await load();
    if (!state.items.length)
      toast(state.language === "en" ? "Feed added" : "订阅已添加");
  } catch (error) {
    toast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = t("添加");
  }
});
$("refreshButton").addEventListener("click", refresh);
$("markAllButton").addEventListener("click", markVisibleRead);
$("exportButton").addEventListener("click", exportOpml);
$("importButton").addEventListener("click", () => $("opmlFile").click());
$("opmlFile").addEventListener("change", (event) =>
  importOpml(event.target.files[0]),
);
$("search").addEventListener("input", renderList);
document.querySelectorAll("[data-view]").forEach((button) =>
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    state.feedId = "";
    render();
  }),
);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    document.body.classList.contains("focus-mode")
  ) {
    document.body.classList.remove("focus-mode");
    renderReader();
  }
});
window.addEventListener("popstate", () => {
  if (document.body.classList.contains("focus-mode")) {
    document.body.classList.remove("focus-mode");
    renderReader();
  }
});
$("languageToggle").addEventListener("click", () => {
  state.language = state.language === "zh" ? "en" : "zh";
  localStorage.setItem("jaspers-rss-language", state.language);
  applyLanguage();
  render();
});
applyLanguage();
render();
load();
setInterval(
  () => {
    if (!document.hidden && !state.busy && state.feeds.length) refresh();
  },
  15 * 60 * 1000,
);
