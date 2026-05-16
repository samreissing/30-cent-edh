// Render a Scryfall-style mana cost string like "{2}{G}{G}" as colored pips.

const COLOR_CLASS: Record<string, string> = {
  W: "W", U: "U", B: "B", R: "R", G: "G", C: "C", S: "C",
};

export function ManaCost({ cost }: { cost: string }) {
  if (!cost) return null;
  const symbols = cost.match(/\{[^}]+\}/g) || [];
  return (
    <span className="whitespace-nowrap">
      {symbols.map((sym, i) => {
        const inner = sym.slice(1, -1);
        const colorClass = COLOR_CLASS[inner] || "";
        return (
          <span key={i} className={`pip ${colorClass}`}>
            {inner.replace("/", "·")}
          </span>
        );
      })}
    </span>
  );
}
