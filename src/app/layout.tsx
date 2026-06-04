import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Options Tracker",
  description: "Track your options trades and monthly fuel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f0f] text-neutral-100 antialiased min-h-screen">
        <nav className="bg-[#0f0f0f] border-b border-[#2a2a2a] px-8 py-4 sticky top-0 z-10 flex items-center gap-6 text-sm">
          <Link href="/" className="text-white font-bold text-base mr-2 tracking-tight">
            <span className="text-green-400">▲</span> Options Tracker
          </Link>
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors font-medium">
            Dashboard
          </Link>
          <Link href="/trades" className="text-neutral-400 hover:text-white transition-colors font-medium">
            Trades
          </Link>
          <Link href="/trades/new" className="text-neutral-400 hover:text-white transition-colors font-medium">
            + New Trade
          </Link>
          <Link href="/fuel" className="text-neutral-400 hover:text-white transition-colors font-medium">
            Fuel
          </Link>
          <Link href="/calendar" className="text-neutral-400 hover:text-white transition-colors font-medium">
            Calendar
          </Link>
          <Link href="/lessons" className="text-neutral-400 hover:text-white transition-colors font-medium">
            Lessons
          </Link>
        </nav>
        <main className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
