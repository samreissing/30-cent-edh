"use client";
import type { Card } from "@/lib/types";
import { ManaCost } from "./ManaCost";

export function CardTile({
  card,
  onAdd,
  onSetCommander,
  inDeck,
}: {
  card: Card;
  onAdd?: (card: Card) => void;
  onSetCommander?: (card: Card) => void;
  inDeck?: number;
}) {
  return (
    <div className="group rounded-lg border border-white/10 bg-white/5 p-3 transition hover:border-emerald-400/50 hover:bg-white/10">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <a
            href={card.scryfall_uri}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-1 font-medium hover:text-emerald-400"
            title={card.name}
          >
            {card.name}
          </a>
          <div className="mt-0.5 truncate text-xs text-white/60">{card.type_line}</div>
        </div>
        <ManaCost cost={card.mana_cost} />
      </div>

      {card.image && (
        // Using img instead of next/image so the static export skips the loader entirely.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.image}
          alt={card.name}
          loading="lazy"
          className="mt-2 aspect-[5/7] w-full rounded-md bg-black/40 object-cover"
        />
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
        <span title="Word count" className={card.word_count > 20 ? "text-amber-300" : ""}>
          {card.word_count}w
        </span>
        <span title="Price">${card.price_min?.toFixed(2) ?? "—"}</span>
        <span className="uppercase">{card.rarity?.[0]}</span>
        {card.banned && <span className="rounded bg-red-500/30 px-1 text-red-200">BANNED</span>}
        {!card.banned && card.commander_eligible && (
          <span className="rounded bg-emerald-500/30 px-1 text-emerald-200">CMDR</span>
        )}
        {!card.banned && card.ninety_nine_eligible && (
          <span className="rounded bg-sky-500/30 px-1 text-sky-200">99</span>
        )}
      </div>

      {(onAdd || onSetCommander) && (
        <div className="mt-2 flex gap-2">
          {onSetCommander && card.commander_eligible && (
            <button
              onClick={() => onSetCommander(card)}
              className="flex-1 rounded bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/40"
            >
              Set commander
            </button>
          )}
          {onAdd && card.ninety_nine_eligible && (
            <button
              onClick={() => onAdd(card)}
              className="flex-1 rounded bg-sky-500/20 px-2 py-1 text-xs font-medium text-sky-200 hover:bg-sky-500/40"
            >
              {inDeck ? `+1 (in deck: ${inDeck})` : "Add to deck"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
