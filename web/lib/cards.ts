import type { Card } from "./types";

let cache: Card[] | null = null;

const ASSET_PREFIX = process.env.NEXT_PUBLIC_BASE_PATH || "";

export async function loadCards(): Promise<Card[]> {
  if (cache) return cache;
  const res = await fetch(`${ASSET_PREFIX}/cards.json`, { cache: "force-cache" });
  if (!res.ok) throw new Error(`failed to load cards.json (${res.status})`);
  cache = (await res.json()) as Card[];
  return cache;
}

export type Filters = {
  query: string;
  colors: Set<string>;       // identity filter — cards must use ONLY these colors
  colorMode: "exact" | "subset" | "any";
  types: Set<string>;        // creature/instant/sorcery/etc.
  maxWords: number | null;
  maxPrice: number | null;
  cmcMin: number | null;
  cmcMax: number | null;
  rarities: Set<string>;
  eligibility: "any" | "ninety_nine" | "commander";
};

export const EMPTY_FILTERS: Filters = {
  query: "",
  colors: new Set(),
  colorMode: "subset",
  types: new Set(),
  maxWords: null,
  maxPrice: null,
  cmcMin: null,
  cmcMax: null,
  rarities: new Set(),
  eligibility: "ninety_nine",
};

const TYPE_TOKENS = ["Creature", "Instant", "Sorcery", "Artifact", "Enchantment", "Land", "Planeswalker", "Battle"];

export function applyFilters(cards: Card[], f: Filters): Card[] {
  const q = f.query.trim().toLowerCase();
  return cards.filter((c) => {
    if (f.eligibility === "ninety_nine" && !c.ninety_nine_eligible) return false;
    if (f.eligibility === "commander" && !c.commander_eligible) return false;

    if (q) {
      const hay = `${c.name} ${c.type_line} ${c.oracle_text}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (f.colors.size > 0) {
      const ci = new Set(c.color_identity);
      if (f.colorMode === "exact") {
        if (ci.size !== f.colors.size) return false;
        for (const col of f.colors) if (!ci.has(col)) return false;
      } else if (f.colorMode === "subset") {
        for (const col of ci) if (!f.colors.has(col)) return false;
      } else if (f.colorMode === "any") {
        let found = false;
        for (const col of f.colors) if (ci.has(col)) { found = true; break; }
        if (!found && f.colors.size > 0) return false;
      }
    }

    if (f.types.size > 0) {
      let match = false;
      for (const t of f.types) {
        if (c.type_line.includes(t)) { match = true; break; }
      }
      if (!match) return false;
    }

    if (f.rarities.size > 0 && !f.rarities.has(c.rarity)) return false;

    if (f.maxWords !== null && c.word_count > f.maxWords) return false;
    if (f.maxPrice !== null && (c.price_min ?? Infinity) > f.maxPrice) return false;
    if (f.cmcMin !== null && c.cmc < f.cmcMin) return false;
    if (f.cmcMax !== null && c.cmc > f.cmcMax) return false;

    return true;
  });
}

export { TYPE_TOKENS };
