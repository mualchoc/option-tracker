"use client";

import type { Trade } from "@/app/generated/prisma/client";

interface Props {
  trades: Trade[];
}

export default function StatsCards({ trades }: Props) {
  const closed = trades.filter((t) => t.status === "CLOSED");
  const open = trades.filter((t) => t.status === "OPEN");
  const winners = closed.filter((t) => (t.pnl ?? 0) > 0);
  const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const winRate = closed.length > 0 ? (winners.length / closed.length) * 100 : 0;
  const avgReturn =
    closed.length > 0
      ? closed.reduce((sum, t) => sum + (t.returnPct ?? 0), 0) / closed.length
      : 0;
  const totalReinvest = winners.reduce((sum, t) => sum + (t.reinvestSuggestion ?? 0), 0);

  const cards = [
    { label: "Total P&L", value: `$${totalPnl.toFixed(2)}`, positive: totalPnl > 0, negative: totalPnl < 0, icon: "◈" },
    { label: "Win Rate", value: `${winRate.toFixed(1)}%`, positive: winRate >= 50, negative: false, icon: "◎" },
    { label: "Open Trades", value: open.length, icon: "◷" },
    { label: "Reinvest Pool", value: `$${totalReinvest.toFixed(2)}`, positive: totalReinvest > 0, negative: false, icon: "◆" },
    { label: "Total Trades", value: trades.length, icon: "▣" },
    { label: "Closed", value: closed.length, icon: "✓" },
    { label: "Avg Return", value: `${avgReturn.toFixed(1)}%`, positive: avgReturn > 0, negative: avgReturn < 0, icon: "%" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col gap-1.5"
        >
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide flex items-center gap-1.5">
            <span className="text-neutral-600">{c.icon}</span>
            {c.label}
          </span>
          <span
            className={`text-xl font-bold tabular-nums ${
              c.positive ? "text-green-400" : c.negative ? "text-red-400" : "text-white"
            }`}
          >
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}
