export default function AboutPage() {
  return (
    <article className="prose prose-invert mx-auto max-w-2xl">
      <h1>About 20-Word 30-Cent EDH</h1>
      <p>
        A homebrew Commander variant where the card pool is everything that costs <strong>$0.30 or less</strong> on
        TCGPlayer and has <strong>20 words or fewer</strong> of rules text. Commanders follow standard EDH eligibility
        and the $0.30 cap but are exempt from the word limit.
      </p>

      <h2>How words are counted</h2>
      <ul>
        <li>Only the rules (oracle) text counts. Card name, type line, flavor text, illustrator, and reminder text in <code>( ... )</code> don't.</li>
        <li>Each mana / loyalty symbol counts as one word. <code>{"{T}: Add {G}"}</code> = 3 words.</li>
        <li>Keywords tokenize literally — "Flying" is 1, "First strike" is 2.</li>
        <li>Hyphenated compounds count as one word ("non-Human" = 1).</li>
      </ul>

      <h2>Data sources</h2>
      <p>
        The card pool comes from the community-curated Google Sheet. Oracle text, prices, and images come from{" "}
        <a href="https://scryfall.com" target="_blank" rel="noreferrer">Scryfall</a>. A nightly GitHub Action
        re-pulls both and rebuilds the site. Prices drift, so a card that's legal today may not be tomorrow.
      </p>

      <h2>Source</h2>
      <p>
        Open source. Issues, PRs, ban-list disagreements all welcome on GitHub.
      </p>
    </article>
  );
}
