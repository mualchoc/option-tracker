import Link from "next/link";
import type { Trade } from "@/app/generated/prisma/client";

interface Props {
  trades: Trade[];
}

function daysOpen(entryDate: Date | string): number {
  return Math.floor((Date.now() - new Date(entryDate).getTime()) / 86_400_000);
}

export default function OpenPositions({ trades }: Props) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
        In Position ({trades.length})
      </h2>

      {trades.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 text-center text-neutral-600 text-sm">
          No open positions.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
          <table className="w-full text-sm">
            <thead className="bg-[#111] border-b border-[#2a2a2a]">
              <tr>
                {["Ticker", "Kind", "Type", "Expiry", "Entry Date", "Entry Price", "Qty", "Days Open"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-left whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => {
                const days = daysOpen(t.entryDate);
                const dayColor =
                  days >= 60 ? "text-red-400" : days >= 30 ? "text-amber-400" : "text-neutral-300";
                const entryPrice = t.executedPrice ?? t.premiumPaid;
                const isStock = t.tradeKind === "STOCK";
                const qty = parseFloat((t.contracts ?? 1).toFixed(7));

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
                          isStock
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }`}
                      >
                        {isStock ? "STOCK" : "OPTION"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isStock ? (
                        <span className="text-neutral-600">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                            t.type === "CALL"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {t.type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                      {isStock || !t.expiry ? (
                        <span className="text-neutral-600">—</span>
                      ) : (() => {
                        const daysLeft = Math.ceil((new Date(t.expiry).getTime() - Date.now()) / 86_400_000);
                        const expiryColor = daysLeft <= 7 ? "text-red-400 font-semibold" : daysLeft <= 14 ? "text-amber-400" : "text-neutral-400";
                        return (
                          <span className={expiryColor}>
                            {new Date(t.expiry).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            <span className="ml-1 text-xs opacity-60">{daysLeft}d</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 tabular-nums whitespace-nowrap">
                      {new Date(t.entryDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-neutral-300 tabular-nums">
                      ${entryPrice?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-300 tabular-nums">
                      {qty}
                      <span className="ml-1 text-xs text-neutral-600">
                        {isStock ? "sh" : "ct"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 tabular-nums font-medium ${dayColor}`}>
                      {days}d
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
