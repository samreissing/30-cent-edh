"""Pull the live Google Sheet and emit data/cardpool.json + data/banlist.json.

The Sheet is public, so we can use the gviz CSV export endpoint without auth:
  https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&gid={GID}

The gid for each tab is stable. We hard-code the ones we need (Master Sheet,
Illegal Cards, Watchlist). If those gids ever change, the action will fail loudly
and we'll fix it here.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent

SHEET_ID = "1KgAk0CGUoB5UgdVLdYjP2W4PF0x6n2lhRxvfjlXT97Y"

# gid is the tab identifier in the Sheet URL. The user shared a link with
# gid=625089475 (Master Sheet). Others need to be discovered.
# We fetch /htmlview once to enumerate gids by title — robust to reorders.
HTMLVIEW = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/htmlview"
CSV_URL = (
    "https://docs.google.com/spreadsheets/d/{sid}/gviz/tq?tqx=out:csv&gid={gid}"
)


def discover_gids() -> dict[str, str]:
    """Scrape the public htmlview to map tab title -> gid.

    Google embeds tab metadata as JS object literals like:
      {name: "Master Sheet", pageUrl: "...gid=625089475", gid: "625089475", ...}
    """
    r = requests.get(HTMLVIEW, timeout=30)
    r.raise_for_status()
    html = r.text
    gids: dict[str, str] = {}
    pattern = re.compile(
        r'\{name:\s*"([^"]+)"[^}]*?gid:\s*"?(\d+)"?',
        re.DOTALL,
    )
    for m in pattern.finditer(html):
        gids.setdefault(m.group(1).strip(), m.group(2))
    return gids


def fetch_csv(gid: str) -> list[list[str]]:
    url = CSV_URL.format(sid=SHEET_ID, gid=gid)
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    reader = csv.reader(io.StringIO(r.text))
    return list(reader)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default=str(ROOT / "data"))
    args = ap.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(exist_ok=True)

    print("discovering tab gids ...")
    gids = discover_gids()
    print(f"  found {len(gids)} tabs")
    needed = ["Master Sheet", "Illegal Cards", "Watchlist"]
    for n in needed:
        if n not in gids:
            print(f"ERROR: could not find tab gid for '{n}'", file=sys.stderr)
            print(f"  available tabs: {sorted(gids)}", file=sys.stderr)
            sys.exit(2)

    # Master Sheet -> cardpool.json
    rows = fetch_csv(gids["Master Sheet"])
    pool: list[str] = []
    seen: set[str] = set()
    for i, row in enumerate(rows):
        if i == 0 or not row:
            continue
        name = (row[0] or "").strip()
        if not name:
            continue
        key = name.casefold()
        if key in seen:
            continue
        seen.add(key)
        pool.append(name)
    (out_dir / "cardpool.json").write_text(json.dumps(pool, indent=2))
    print(f"  cardpool  -> {len(pool):>6} cards")

    # Illegal Cards -> banlist.json
    rows = fetch_csv(gids["Illegal Cards"])
    banned = []
    for i, row in enumerate(rows):
        if i == 0 or not row or len(row) < 2:
            continue
        name = (row[1] or "").strip()
        if not name:
            continue
        banned.append({
            "date_checked": (row[0] or "").strip() if len(row) > 0 else None,
            "name": name,
            "checked_by": (row[2] or "").strip() if len(row) > 2 else None,
            "scryfall_link": (row[3] or "").strip() if len(row) > 3 else None,
            "status": (row[4] or "").strip() if len(row) > 4 else None,
            "note": (row[5] or "").strip() if len(row) > 5 else None,
        })
    (out_dir / "banlist.json").write_text(json.dumps(banned, indent=2))
    print(f"  banlist   -> {len(banned):>6} cards")

    # Watchlist -> watchlist.json
    rows = fetch_csv(gids["Watchlist"])
    watch = []
    for i, row in enumerate(rows):
        if i == 0 or not row or len(row) < 2:
            continue
        name = (row[1] or "").strip()
        if not name:
            continue
        watch.append({
            "date_checked": (row[0] or "").strip() if len(row) > 0 else None,
            "name": name,
            "checked_by": (row[2] or "").strip() if len(row) > 2 else None,
            "scryfall_link": (row[3] or "").strip() if len(row) > 3 else None,
            "status": (row[4] or "").strip() if len(row) > 4 else None,
        })
    (out_dir / "watchlist.json").write_text(json.dumps(watch, indent=2))
    print(f"  watchlist -> {len(watch):>6} cards")

    (out_dir / "_sheet_meta.json").write_text(json.dumps({
        "sheet_id": SHEET_ID,
        "pulled_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "discovered_tabs": gids,
    }, indent=2))


if __name__ == "__main__":
    main()
