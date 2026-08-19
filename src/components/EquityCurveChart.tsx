"use client";

import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { Trade } from "@/app/generated/prisma/client";

type TimeRange = "3M" | "6M" | "1Y" | "YTD" | "ALL";
const RANGES: TimeRange[] = ["3M", "6M", "1Y", "YTD", "ALL"];

type ViewFilter = "ALL" | "OPTION" | "STOCK";
const VIEWS: { key: ViewFilter; label: string }[] = [
  { key: "ALL",    label: "All" },
  { key: "OPTION", label: "Options" },
  { key: "STOCK",  label: "Stocks" },
];

function getCutoffDate(range: TimeRange): Date | null {
  const now = new Date();
  if (range === "3M")  return new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate());
  if (range === "6M")  return new Date(now.getFullYear(), now.getMonth() - 6,  now.getDate());
  if (range === "1Y")  return new Date(now.getFullYear() - 1, now.getMonth(),  now.getDate());
  if (range === "YTD") return new Date(now.getFullYear(), 0, 1);
  return null;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface StatTileProps {
  label: string;
  value: string;
  color?: string;
}
function StatTile({ label, value, color = "text-white" }: StatTileProps) {
  return (
    <div>
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

interface Props {
  trades: Trade[];
}

export default function EquityCurveChart({ trades }: Props) {
  const [range, setRange] = useState<TimeRange>("ALL");
  const [view, setView] = useState<ViewFilter>("ALL");

  const { chartData, wins, losses, totalPnl, winRate, count } = useMemo(() => {
    const closed = trades.filter(
      (t) => t.status === "CLOSED" && t.pnl != null && t.exitDate != null
    );
    const kindFiltered = view === "ALL" ? closed : closed.filter((t) => t.tradeKind === view);
    const cutoff = getCutoffDate(range);
    const filtered = cutoff
      ? kindFiltered.filter((t) => new Date(t.exitDate!) >= cutoff)
      : kindFiltered;
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime()
    );

    let running = 0;
    const chartData = sorted.map((t) => {
      running += t.pnl!;
      return { date: formatDate(t.exitDate!), cumPnl: +running.toFixed(2), ticker: t.ticker };
    });

    const wins   = filtered.filter((t) => (t.pnl ?? 0) > 0);
    const losses = filtered.filter((t) => (t.pnl ?? 0) <= 0);
    const totalPnl = filtered.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const winRate = filtered.length > 0 ? (wins.length / filtered.length) * 100 : 0;

    return { chartData, wins, losses, totalPnl, winRate, count: filtered.length };
  }, [trades, range, view]);

  const lastVal = chartData.length > 0 ? chartData[chartData.length - 1].cumPnl : 0;
  const strokeColor = lastVal >= 0 ? "#22c55e" : "#ef4444";

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                view === key
                  ? "bg-[#2a2a2a] text-white border-[#3a3a3a]"
                  : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                range === r
                  ? "bg-[#2a2a2a] text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-neutral-600 text-sm">
          No closed trades in this window.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#2a2a2a" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              formatter={(val) => [`$${Number(val).toFixed(2)}`, "Cumulative P&L"]}
              contentStyle={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                color: "#f5f5f5",
                fontSize: 12,
              }}
              cursor={{ stroke: "#3a3a3a", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="cumPnl"
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#equityGradient)"
              dot={false}
              activeDot={{ r: 4, fill: strokeColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t border-[#2a2a2a]">
        <StatTile
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          color={winRate >= 50 ? "text-green-400" : count === 0 ? "text-white" : "text-red-400"}
        />
        <StatTile label="# Trades"  value={String(count)} />
        <StatTile label="# Wins"    value={String(wins.length)} />
        <StatTile label="# Losses"  value={String(losses.length)} />
        <StatTile
          label="Total P&L"
          value={`${totalPnl >= 0 ? "" : "-"}$${Math.abs(totalPnl).toFixed(2)}`}
          color={totalPnl > 0 ? "text-green-400" : totalPnl < 0 ? "text-red-400" : "text-white"}
        />
      </div>
    </div>
  );
}
