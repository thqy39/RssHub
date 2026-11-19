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
