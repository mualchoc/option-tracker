"use client";

import Link from "next/link";
import type { Trade } from "@/app/generated/prisma/client";

interface Props {
  trades: Trade[];
}

function StatusBadge({ trade }: { trade: Trade }) {
  if (trade.status === "OPEN") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
        OPEN
      </span>
    );
  }
  const isWin = (trade.pnl ?? 0) >= 0;
  return isWin ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
      WIN
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
      LOSS
    </span>
  );
}

export default function TradeTable({ trades }: Props) {
  if (trades.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
        <p className="text-neutral-500 text-sm">
          No trades yet.{" "}
          <Link href="/trades/new" className="text-blue-400 hover:text-blue-300">
            Log your first trade.
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
      <table className="w-full text-sm">
        <thead className="bg-[#111] border-b border-[#2a2a2a]">
          <tr>
            {["Ticker", "Type", "Strike", "Expiry", "Exec. Price", "Entry", "Status", "P&L", "Return %"].map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-left whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => {
            const pnlColor =
              t.status === "OPEN"
                ? "text-neutral-600"
                : (t.pnl ?? 0) > 0
                ? "text-green-400 font-semibold"
                : "text-red-400 font-semibold";

            return (
              <tr
                key={t.id}
                className={`border-b border-[#2a2a2a] hover:bg-[#222] transition-colors ${
                  i % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#1e1e1e]"
                }`}
              >
                <td className="px-4 py-3 font-semibold whitespace-nowrap">
                  <Link href={`/trades/${t.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                    {t.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                      t.type === "CALL"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-300 tabular-nums">${t.strike}</td>
                <td className="px-4 py-3 text-neutral-500 tabular-nums whitespace-nowrap">
                  {new Date(t.expiry).toLocaleDateString("en-US")}
                </td>
                <td className="px-4 py-3 text-neutral-300 tabular-nums">${t.premiumPaid}</td>
                <td className="px-4 py-3 text-neutral-500 tabular-nums whitespace-nowrap">
                  {new Date(t.entryDate).toLocaleDateString("en-US")}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge trade={t} />
                </td>
                <td className={`px-4 py-3 tabular-nums ${pnlColor}`}>
                  {t.pnl != null ? `$${t.pnl.toFixed(2)}` : "—"}
                </td>
                <td className={`px-4 py-3 tabular-nums ${pnlColor}`}>
                  {t.returnPct != null ? `${t.returnPct.toFixed(1)}%` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
