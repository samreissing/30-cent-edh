import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "20-Word 30-Cent EDH",
  description:
    "A searchable card database and deck builder for the 20-word, 30-cent Commander format.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/10 bg-black/30 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              20-Word · 30-Cent <span className="text-emerald-400">EDH</span>
            </Link>
            <div className="flex gap-4 text-sm text-white/70">
              <Link href="/" className="hover:text-white">Browse</Link>
              <Link href="/deck-builder" className="hover:text-white">Deck Builder</Link>
              <Link href="/about" className="hover:text-white">About</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 py-12 text-center text-xs text-white/40">
          Card data via{" "}
          <a className="underline" href="https://scryfall.com" target="_blank" rel="noreferrer">
            Scryfall
          </a>
          . Format and ban list curated by the 30-cent EDH community.
        </footer>
      </body>
    </html>
  );
}
