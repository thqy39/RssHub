import path from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "../..");

export const database = new Low(
  new JSONFile(path.join(projectRoot, "data.json")),
);

await database.read();
database.data ||= { feeds: [], items: [] };

const legacyFeedUrls = new Map([
  [
    "https://learningenglish.voanews.com/api/ziiy_l-vomx-tpemgtv",
    "https://learningenglish.voanews.com/podcast/?zoneId=1689",
  ],
  [
    "https://learningenglish.voanews.com/api/zyg__l-vomx-tpetmty",
    "https://learningenglish.voanews.com/podcast/?zoneId=1581",
  ],
  [
    "https://learningenglish.voanews.com/api/zoroqql-vomx-tpeptpqq",
    "https://learningenglish.voanews.com/podcast/?zoneId=4456",
  ],
  [
    "https://learningenglish.voanews.com/api/zmypyl-vomx-tpeyry_",
    "https://learningenglish.voanews.com/podcast/?zoneId=987",
  ],
]);

let migrated = false;
for (const feed of database.data.feeds) {
  const currentUrl = legacyFeedUrls.get(feed.url);
  if (!currentUrl) continue;
  feed.url = currentUrl;
  migrated = true;
}

if (migrated) await database.write();
