"""Fetch a handful of cards from Scryfall and run the word counter against them.
Used as a quick correctness check; not part of the production pipeline."""

from __future__ import annotations
import json
import time
import urllib.parse
import urllib.request

from word_count import explain

NAMES = [
    "Striped Bears",
    "Anaba Bodyguard",
    "Lightning Bolt",
    "Llanowar Elves",
    "Counterspell",
    "Birds of Paradise",
    "Snapcaster Mage",
    "Sol Ring",
    "Plains",
    "Cathartic Reunion",
    "Eladamri, Korvecdal",
    "Goblin Guide",
    # Extra coverage for the new rules:
    "Cumulative Anchor",  # may not exist; replace if needed
    "Living Weapon",
    "Cascade",
]


def fetch(name: str) -> dict | None:
    url = f"https://api.scryfall.com/cards/named?exact={urllib.parse.quote(name)}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "20w30c-edh-prototype/0.1",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except Exception as e:
        print(f"  ! failed to fetch {name}: {e}")
        return None


def main() -> None:
    for name in NAMES:
        data = fetch(name)
        time.sleep(0.1)
        if not data:
            continue
        oracle = data.get("oracle_text") or ""
        if not oracle and "card_faces" in data:
            oracle = "\n".join(f.get("oracle_text", "") for f in data["card_faces"])
        n, toks = explain(oracle)
        price = (data.get("prices") or {}).get("usd")
        print(f"\n{'='*72}\n{data['name']}  count={n}  price=${price}")
        print("ORACLE:", oracle)
        print("TOKENS:", toks)


if __name__ == "__main__":
    main()
