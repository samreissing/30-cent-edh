// Copies data/cards.json into public/ so the static site can fetch('/cards.json').
// Run automatically before `npm run dev` and `npm run build`.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const publicDir = resolve(here, "..", "public");
mkdirSync(publicDir, { recursive: true });

const files = ["cards.json", "stats.json", "banlist.json", "watchlist.json"];
for (const f of files) {
  const src = resolve(root, "data", f);
  if (!existsSync(src)) {
    console.warn(`[copy-data] missing ${src} — run the pipeline first`);
    continue;
  }
  copyFileSync(src, resolve(publicDir, f));
  console.log(`[copy-data] copied ${f}`);
}
