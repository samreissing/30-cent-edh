"""Download Scryfall's bulk data dump.

We use the `default-cards` bulk type: one entry per card (latest English printing,
preferred art). ~140 MB, ~30k cards. Way faster than 21k individual API calls.

Re-downloads once per day unless --force is passed.
"""

from __future__ import annotations

import argparse
import gzip
import json
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
BULK_PATH = ROOT / "pipeline" / "scryfall_bulk.json"
META_PATH = ROOT / "pipeline" / "scryfall_meta.json"
BULK_API = "https://api.scryfall.com/bulk-data"
HEADERS = {"User-Agent": "20w30c-edh/0.1 (+https://github.com/)", "Accept": "application/json"}


def needs_refresh(force: bool) -> bool:
    if force or not BULK_PATH.exists() or not META_PATH.exists():
        return True
    try:
        meta = json.loads(META_PATH.read_text())
        return (time.time() - meta.get("fetched_at", 0)) > 24 * 3600
    except Exception:
        return True


def fetch(force: bool = False) -> Path:
    if not needs_refresh(force):
        print(f"using cached bulk data at {BULK_PATH} ({BULK_PATH.stat().st_size/1e6:.1f} MB)")
        return BULK_PATH

    print("looking up current bulk-data manifest from Scryfall...")
    r = requests.get(BULK_API, headers=HEADERS, timeout=30)
    r.raise_for_status()
    manifest = r.json()
    target = next(b for b in manifest["data"] if b["type"] == "default_cards")
    # Scryfall switched from download_uri (JSON array) to jsonl_download_uri
    # (gzipped JSONL) in 2025. Accept either for forward/backward compatibility.
    url = target.get("jsonl_download_uri") or target.get("download_uri")
    if not url:
        raise KeyError(
            "bulk-data entry for default_cards has neither jsonl_download_uri "
            "nor download_uri"
        )
    size_bytes = target.get("compressed_size") or target.get("size") or 0
    size_mb = size_bytes / 1e6
    print(f"downloading default_cards ({size_mb:.1f} MB) from {url} ...")

    with requests.get(url, headers=HEADERS, stream=True, timeout=300) as resp:
        resp.raise_for_status()
        total = 0
        raw = bytearray()
        for chunk in resp.iter_content(chunk_size=1 << 20):
            if not chunk:
                continue
            raw.extend(chunk)
            total += len(chunk)
            if total % (10 << 20) < (1 << 20):
                print(f"  {total/1e6:.1f} MB ...", flush=True)

    if url.endswith(".gz") or url.endswith(".jsonl.gz"):
        print("decompressing JSONL bulk dump ...")
        text = gzip.decompress(bytes(raw)).decode("utf-8")
        cards = [json.loads(line) for line in text.splitlines() if line.strip()]
        BULK_PATH.write_text(json.dumps(cards))
    else:
        BULK_PATH.write_bytes(raw)
    META_PATH.write_text(json.dumps({
        "fetched_at": time.time(),
        "scryfall_updated_at": target.get("updated_at"),
        "size_bytes": BULK_PATH.stat().st_size,
    }))
    print(f"saved {BULK_PATH} ({BULK_PATH.stat().st_size/1e6:.1f} MB)")
    return BULK_PATH


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-download even if cached")
    args = ap.parse_args()
    fetch(force=args.force)
