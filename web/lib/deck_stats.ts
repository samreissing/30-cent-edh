import type { Card, Deck } from "./types";

export type DeckStats = {
  total: number;
  lands: number;
  nonlandCount: number;
  avgCmcNonland: number | null;
  // curve[i] = number of nonland cards with rounded CMC == i.
  // Length is `max(8, maxCmcInDeck + 1)` so the X-axis always has at least
  // 0..7 visible and grows to fit chonky decks (e.g. a 15-CMC card).
  curve: number[];
  types: { label: string; count: number }[];
};

const TYPE_BUCKETS: { label: string; predicate: (t: string) => boolean }[] = [
  { label: "Creature",     predicate: (t) => t.includes("Creature") },
  { label: "Land",         predicate: (t) => t.includes("Land") },
  { label: "Instant",      predicate: (t) => t.includes("Instant") },
  { label: "Sorcery",      predicate: (t) => t.includes("Sorcery") },
  { label: "Artifact",     predicate: (t) => t.includes("Artifact") && !t.includes("Creature") },
  { label: "Enchantment",  predicate: (t) => t.includes("Enchantment") && !t.includes("Creature") },
  { label: "Planeswalker", predicate: (t) => t.includes("Planeswalker") },
  { label: "Battle",       predicate: (t) => t.includes("Battle") },
];

export function computeStats(deck: Deck, byName: Map<string, Card>): DeckStats {
  const stats: DeckStats = {
    total: 0,
    lands: 0,
    nonlandCount: 0,
    avgCmcNonland: null,
    curve: [],  // sized after we know the max CMC in the deck
    types: TYPE_BUCKETS.map((b) => ({ label: b.label, count: 0 })),
  };

  let cmcSum = 0;
  let maxCmc = 0;
  const entries: { card: Card | undefined; count: number; name: string; isCmdr: boolean }[] = [];
  for (const s of deck.ninety_nine) {
    entries.push({ card: byName.get(s.name), count: s.count, name: s.name, isCmdr: false });
  }
  if (deck.commander) {
    entries.push({
      card: byName.get(deck.commander),
      count: 1,
      name: deck.commander,
      isCmdr: true,
    });
  }

  // First pass: discover max CMC so we can size the curve array.
  for (const { card } of entries) {
    if (!card) continue;
    if (card.type_line.includes("Land")) continue;
    const cmc = Math.round(card.cmc ?? 0);
    if (cmc > maxCmc) maxCmc = cmc;
  }
  // Always show at least 0..7 on the axis; expand if deck has anything higher.
  const curveLen = Math.max(8, maxCmc + 1);
  stats.curve = new Array(curveLen).fill(0);

  for (const { card, count } of entries) {
    if (!card) {
      stats.total += count;
      continue;
    }
    stats.total += count;
    const t = card.type_line;
    const isLand = t.includes("Land");

    if (isLand) {
      stats.lands += count;
    } else {
      stats.nonlandCount += count;
      const cmc = Math.round(card.cmc ?? 0);
      stats.curve[cmc] += count;
      cmcSum += (card.cmc ?? 0) * count;
    }

    for (let i = 0; i < TYPE_BUCKETS.length; i++) {
      if (TYPE_BUCKETS[i].predicate(t)) {
        stats.types[i].count += count;
        break;  // first matching bucket wins so a card counts once
      }
    }
  }

  if (stats.nonlandCount > 0) stats.avgCmcNonland = cmcSum / stats.nonlandCount;
  return stats;
}
