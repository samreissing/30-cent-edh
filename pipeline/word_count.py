"""Count rules-text words on an MTG oracle text per the 20-word-30-cent EDH format.

Rules (per format author):
- Count tokens in the oracle (rules) text only.
- Reminder text inside `( ... )` is excluded.
- Each mana / tap / loyalty symbol (e.g. {T}, {G}, {2}, {W/U}, [+1]) counts as 1 word.
  `{T}: Add {G}.` -> 3 words (Tap, Add, Green).
  `{2}{G}{G}` -> 3 words.
- Keyword abilities tokenize literally: "Flying" = 1, "First strike" = 2.
- Hyphenated compounds count as one word ("non-Human" = 1).
- Em-dashes and bullets between modes are separators, not words.
"""

from __future__ import annotations
import re

_PAREN_RE = re.compile(r"\([^)]*\)")
_MANA_SYMBOL_RE = re.compile(r"\{[^}]*\}")
_LOYALTY_RE = re.compile(r"\[[+\-−]?\d+\]|(?<![A-Za-z0-9])[+\-−]\d+:")
_BULLET_RE = re.compile(r"[•·]")


def _replace_symbols_with_placeholder(text: str) -> str:
    """Replace each mana/loyalty symbol with a sentinel token that survives
    tokenization. Sentinel is `SYM<digit>` — picked because it's a single
    alphanumeric token the word regex will count as 1."""
    out = []
    i = 0
    counter = 0
    while i < len(text):
        ch = text[i]
        if ch == "{":
            end = text.find("}", i)
            if end != -1:
                counter += 1
                out.append(f" SYM{counter} ")
                i = end + 1
                continue
        if ch == "[":
            end = text.find("]", i)
            if end != -1 and re.fullmatch(r"\[[+\-−]?\d+\]", text[i:end+1]):
                counter += 1
                out.append(f" SYM{counter} ")
                i = end + 1
                continue
        out.append(ch)
        i += 1
    return "".join(out)


def strip_oracle(text: str) -> str:
    """Strip reminder text and separators; replace symbols with countable placeholders."""
    if not text:
        return ""
    text = _PAREN_RE.sub(" ", text)             # drop reminder text first
    text = _replace_symbols_with_placeholder(text)  # mana / loyalty symbols -> 1 token each
    # Walker loyalty cost form `+1:` / `-2:` (with no brackets) -> single token.
    text = re.sub(r"(?<![A-Za-z0-9])([+\-−]\d+):", r" SYMLOY ", text)
    text = _BULLET_RE.sub(" ", text)
    # Dashes used as separators (between spaces or line starts) -> whitespace,
    # preserving intra-word hyphens like "non-Human".
    text = re.sub(r"(?<=\s)[—–−](?=\s)", " ", text)
    text = re.sub(r"^[—–−]\s", " ", text, flags=re.MULTILINE)
    return text


_WORD_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9'\-]*")


def count_words(text: str) -> int:
    return len(_WORD_RE.findall(strip_oracle(text)))


def explain(text: str) -> tuple[int, list[str]]:
    """Return (count, tokens) for human verification.
    Symbol placeholders are restored to their original form in the token list."""
    if not text:
        return 0, []
    # Re-run the stripping but remember the original symbols, in order.
    symbols: list[str] = []
    def _capture(m):
        symbols.append(m.group(0))
        return f" SYM{len(symbols)} "
    captured = _PAREN_RE.sub(" ", text)
    captured = re.sub(r"\{[^}]*\}", _capture, captured)
    captured = re.sub(r"\[[+\-−]?\d+\]", _capture, captured)
    captured = re.sub(
        r"(?<![A-Za-z0-9])([+\-−]\d+):",
        lambda m: (symbols.append(m.group(1) + ":") or f" SYM{len(symbols)} "),
        captured,
    )
    captured = _BULLET_RE.sub(" ", captured)
    captured = re.sub(r"(?<=\s)[—–−](?=\s)", " ", captured)
    captured = re.sub(r"^[—–−]\s", " ", captured, flags=re.MULTILINE)

    tokens_raw = _WORD_RE.findall(captured)
    tokens = []
    for t in tokens_raw:
        m = re.fullmatch(r"SYM(\d+)", t)
        if m:
            idx = int(m.group(1)) - 1
            tokens.append(symbols[idx] if idx < len(symbols) else t)
        else:
            tokens.append(t)
    return len(tokens), tokens


if __name__ == "__main__":
    import json
    import sys

    samples = json.load(sys.stdin)
    for card in samples:
        n, toks = explain(card["oracle_text"])
        print(f"\n=== {card['name']} ({n} words) ===")
        print("ORACLE:", repr(card["oracle_text"]))
        print("TOKENS:", toks)
