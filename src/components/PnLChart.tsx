"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { Trade } from "@/app/generated/prisma/client";

interface Props {
  trades: Trade[];
}

export default function PnLChart({ trades }: Props) {
  const closed = trades
    .filter((t) => t.status === "CLOSED" && t.pnl != null)
    .map((t) => ({ name: `${t.ticker} #${t.id}`, pnl: t.pnl as number }));

  if (closed.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 text-center text-neutral-600 text-sm">
        No closed trades to chart yet.
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={closed} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={{ stroke: "#2a2a2a" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [`$${Number(v).toFixed(2)}`, "P&L"]}
            contentStyle={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              color: "#f5f5f5",
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {closed.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
