# 20-Word, 30-Cent EDH

A searchable database and deck builder for a homebrew Commander variant where every card in the 99 must be:

1. **≤ $0.30** on TCGPlayer (per Scryfall pricing)
2. **≤ 20 words** of rules text (reminder text excluded)

Commanders follow standard EDH commander eligibility and the $0.30 cap, but have no word limit.

## Pipeline

```
Google Sheet (cardpool + ban list)
        │
        ▼  pipeline/pull_sheet.py
   data/cardpool.json
        │
        ▼  pipeline/enrich.py  ← joins with Scryfall bulk data
   data/cards.json   ← word-counted, tagged, ready for the site
        │
        ▼  web/  (Next.js + Tailwind)
   GitHub Pages
```

## Word-counting rules

- Only oracle (rules) text. Card name, type line, flavor text, and reminder text in `( ... )` are excluded.
- Each mana / loyalty symbol counts as 1 word — `{T}: Add {G}.` = 3 words.
- Keywords tokenize literally — "Flying" = 1, "First strike" = 2.

See `pipeline/word_count.py`.

## Local dev

```bash
# Pipeline
python3 -m venv .venv
.venv/bin/pip install -r pipeline/requirements.txt
.venv/bin/python pipeline/run_pipeline.py

# Web
cd web && npm install && npm run dev
```
