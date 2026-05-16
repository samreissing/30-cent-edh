// Deck state — kept in localStorage, plus helpers for format-legality checks.

import type { Card, Deck, DeckSlot } from "./types";

const STORAGE_KEY = "20w30c-deck-v1";

export function emptyDeck(): Deck {
  return { commander: null, ninety_nine: [] };
}

export function loadDeck(): Deck {
  if (typeof window === "undefined") return emptyDeck();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Deck) : emptyDeck();
  } catch {
    return emptyDeck();
  }
}

export function saveDeck(deck: Deck) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
}

export function totalCards(deck: Deck): number {
  return (deck.commander ? 1 : 0) + deck.ninety_nine.reduce((s, x) => s + x.count, 0);
}

// "Basic land" names — unlimited copies allowed in EDH. Snow-Covered variants too.
const BASIC_NAMES = new Set([
  "Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes",
  "Snow-Covered Plains", "Snow-Covered Island", "Snow-Covered Swamp",
  "Snow-Covered Mountain", "Snow-Covered Forest", "Snow-Covered Wastes",
]);
export const isBasic = (name: string) => BASIC_NAMES.has(name);

export function addToDeck(deck: Deck, card: Card): { deck: Deck; error?: string } {
  if (!card.ninety_nine_eligible) return { deck, error: `${card.name} isn't 99-eligible.` };
  if (deck.commander && card.name === deck.commander) {
    return { deck, error: `${card.name} is your commander.` };
  }
  // Commander color identity restriction:
  // (we don't enforce here when no commander is set; the validate() call surfaces it)
  const existing = deck.ninety_nine.find((s) => s.name === card.name);
  if (existing) {
    if (!isBasic(card.name)) {
      return { deck, error: `${card.name} is already in the deck (singleton).` };
    }
    return {
      deck: {
        ...deck,
        ninety_nine: deck.ninety_nine.map((s) =>
          s.name === card.name ? { ...s, count: s.count + 1 } : s,
        ),
      },
    };
  }
  return {
    deck: { ...deck, ninety_nine: [...deck.ninety_nine, { name: card.name, count: 1 }] },
  };
}

export function removeOne(deck: Deck, name: string): Deck {
  const slot = deck.ninety_nine.find((s) => s.name === name);
  if (!slot) return deck;
  if (slot.count <= 1) {
    return { ...deck, ninety_nine: deck.ninety_nine.filter((s) => s.name !== name) };
  }
  return {
    ...deck,
    ninety_nine: deck.ninety_nine.map((s) =>
      s.name === name ? { ...s, count: s.count - 1 } : s,
    ),
  };
}

export type Issue = { kind: "error" | "warn"; message: string };

export function validate(deck: Deck, byName: Map<string, Card>): Issue[] {
  const issues: Issue[] = [];
  const total = totalCards(deck);
  if (total !== 100) {
    issues.push({
      kind: "error",
      message: `Deck must be exactly 100 cards (currently ${total}).`,
    });
  }
  if (!deck.commander) {
    issues.push({ kind: "error", message: "Choose a commander." });
  }

  const commander = deck.commander ? byName.get(deck.commander) : null;
  if (commander) {
    const cmdrColors = new Set(commander.color_identity);
    for (const slot of deck.ninety_nine) {
      const card = byName.get(slot.name);
      if (!card) {
        issues.push({ kind: "warn", message: `Unknown card in deck: ${slot.name}` });
        continue;
      }
      for (const c of card.color_identity) {
        if (!cmdrColors.has(c)) {
          issues.push({
            kind: "error",
            message: `${card.name} has color identity ${card.color_identity.join("")} — outside commander's ${commander.color_identity.join("") || "C"}.`,
          });
          break;
        }
      }
    }
  }

  for (const slot of deck.ninety_nine) {
    if (slot.count > 1 && !isBasic(slot.name)) {
      issues.push({
        kind: "error",
        message: `${slot.name} has ${slot.count} copies — only basics may exceed 1.`,
      });
    }
    const card = byName.get(slot.name);
    if (card && !card.ninety_nine_eligible) {
      issues.push({
        kind: "error",
        message: `${slot.name} is not 99-eligible (${card.word_count}w, $${card.price_min?.toFixed(2) ?? "?"}).`,
      });
    }
  }

  return issues;
}

export function exportText(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) lines.push(`1 ${deck.commander} *CMDR*`);
  for (const s of [...deck.ninety_nine].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`${s.count} ${s.name}`);
  }
  return lines.join("\n");
}
