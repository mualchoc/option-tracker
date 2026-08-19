"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TradeSummary = {
  id: number;
  ticker: string;
  type: string | null;
  strike: number | null;
  entryDate: string;
  exitDate: string | null;
  status: string;
  pnl: number | null;
  holdDays: number | null;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const LANE_HEIGHT = 26; // px per lane
const DAY_NUMBER_HEIGHT = 28; // px reserved for day numbers at top of row

/** Strip time from a Date — compare dates only */
function toDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Build the weeks array for a given year/month */
function buildWeeks(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(firstDay.getDay()).fill(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

/** For a trade, find the column range [startCol, endCol] within a given week row */
function tradeColsInWeek(
  trade: TradeSummary,
  week: (Date | null)[],
  today: Date
): { startCol: number; endCol: number } | null {
  const tradeStart = toDay(new Date(trade.entryDate));
  const tradeEnd = toDay(trade.exitDate ? new Date(trade.exitDate) : today);

  // Find first and last valid day in this week
  const weekStart = week.find((d) => d !== null) as Date;
  const weekEnd = [...week].reverse().find((d) => d !== null) as Date;

  if (tradeEnd < weekStart || tradeStart > weekEnd) return null;

  const clippedStart = tradeStart < weekStart ? weekStart : tradeStart;
  const clippedEnd = tradeEnd > weekEnd ? weekEnd : tradeEnd;

  // Map dates to column indices
  let startCol = -1;
  let endCol = -1;
  week.forEach((d, i) => {
    if (!d) return;
    const day = toDay(d);
    if (day.getTime() === clippedStart.getTime()) startCol = i;
    if (day.getTime() === clippedEnd.getTime()) endCol = i;
  });

  // Handle edge: clippedStart might be on a null padding cell — find nearest
  if (startCol === -1) {
    for (let i = 0; i < 7; i++) {
      if (week[i]) { startCol = i; break; }
    }
  }
  if (endCol === -1) {
    for (let i = 6; i >= 0; i--) {
      if (week[i]) { endCol = i; break; }
    }
  }
  if (startCol === -1 || endCol === -1 || endCol < startCol) return null;
  return { startCol, endCol };
}

/** Assign lane indices to avoid visual overlap within a week */
function assignLanes(
  items: { startCol: number; endCol: number; id: number }[]
): Map<number, number> {
  const laneMap = new Map<number, number>();
  const laneEnds: number[] = []; // track the endCol of last item in each lane

  const sorted = [...items].sort((a, b) => a.startCol - b.startCol);
  for (const item of sorted) {
    let lane = laneEnds.findIndex((end) => end < item.startCol);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.endCol;
    laneMap.set(item.id, lane);
  }
  return laneMap;
}

function tradeColor(trade: TradeSummary): { bg: string; text: string; border: string } {
  if (trade.status === "OPEN") return { bg: "#1d4ed8", text: "#bfdbfe", border: "#3b82f6" };
  if ((trade.pnl ?? 0) >= 0) return { bg: "#15803d", text: "#bbf7d0", border: "#22c55e" };
  return { bg: "#b91c1c", text: "#fecaca", border: "#ef4444" };
}

export default function TradeCalendar({ trades }: { trades: TradeSummary[] }) {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const today = toDay(now);
  const weeks = buildWeeks(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
        <button
          onClick={prevMonth}
          className="text-neutral-400 hover:text-white px-3 py-1 rounded hover:bg-[#2a2a2a] transition-colors cursor-pointer text-lg"
        >
          ←
        </button>
        <span className="text-white font-semibold text-base">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="text-neutral-400 hover:text-white px-3 py-1 rounded hover:bg-[#2a2a2a] transition-colors cursor-pointer text-lg"
        >
          →
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-[#2a2a2a]">
        {DAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => {
        // Collect trades active this week and their column spans
        const weekItems = trades
          .map((t) => {
            const cols = tradeColsInWeek(t, week, today);
            if (!cols) return null;
            return { trade: t, ...cols };
          })
          .filter(Boolean) as { trade: TradeSummary; startCol: number; endCol: number }[];

        const laneMap = assignLanes(weekItems.map(i => ({ id: i.trade.id, startCol: i.startCol, endCol: i.endCol })));
        const laneCount = laneMap.size > 0 ? Math.max(...laneMap.values()) + 1 : 0;
        const rowHeight = DAY_NUMBER_HEIGHT + laneCount * LANE_HEIGHT + 8;

        return (
          <div
            key={wi}
            className="relative border-b border-[#2a2a2a] last:border-b-0"
            style={{ minHeight: rowHeight }}
          >
            {/* Day number cells */}
            <div className="grid grid-cols-7 h-7">
              {week.map((day, di) => {
                const isToday = day && toDay(day).getTime() === today.getTime();
                return (
                  <div key={di} className="px-2 pt-1.5">
                    {day && (
                      <span className={`text-xs font-medium tabular-nums ${
                        isToday
                          ? "bg-blue-500 text-white rounded-full px-1.5 py-0.5"
                          : "text-neutral-500"
                      }`}>
                        {day.getDate()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Trade bars */}
            {weekItems.map(({ trade, startCol, endCol }) => {
              const lane = laneMap.get(trade.id) ?? 0;
              const { bg, text, border } = tradeColor(trade);
              const top = DAY_NUMBER_HEIGHT + lane * LANE_HEIGHT;
              const left = (startCol / 7) * 100;
              const width = ((endCol - startCol + 1) / 7) * 100;

              const totalDays = trade.holdDays ?? (
                trade.exitDate
                  ? Math.round((new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime()) / 86400000)
                  : Math.round((today.getTime() - new Date(trade.entryDate).getTime()) / 86400000)
              );

              const pnlText = trade.status === "OPEN"
                ? "OPEN"
                : trade.pnl != null
                  ? `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(0)}`
                  : "";

              const typeStr = trade.type ?? "";
              const strikeStr = trade.strike != null ? ` $${trade.strike}` : "";
              const label = `${trade.ticker}${typeStr ? ` ${typeStr}` : ""} · ${totalDays}d${pnlText ? " · " + pnlText : ""}`;

              return (
                <div
                  key={trade.id}
                  onClick={() => router.push(`/trades/${trade.id}`)}
                  title={`${trade.ticker}${typeStr ? ` ${typeStr}` : ""}${strikeStr} — ${totalDays} days${pnlText ? " — " + pnlText : ""}`}
                  style={{
                    position: "absolute",
                    top: top,
                    left: `calc(${left}% + 2px)`,
                    width: `calc(${width}% - 4px)`,
                    height: LANE_HEIGHT - 4,
                    backgroundColor: bg,
                    border: `1px solid ${border}`,
                    color: text,
                  }}
                  className="rounded text-xs font-medium flex items-center px-2 cursor-pointer overflow-hidden whitespace-nowrap hover:brightness-125 transition-all"
                >
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-5 px-5 py-3 border-t border-[#2a2a2a] bg-[#111]">
        <span className="text-xs text-neutral-600 font-medium uppercase tracking-wide">Legend:</span>
        {[
          { color: "#15803d", border: "#22c55e", text: "#bbf7d0", label: "WIN" },
          { color: "#b91c1c", border: "#ef4444", text: "#fecaca", label: "LOSS" },
          { color: "#1d4ed8", border: "#3b82f6", text: "#bfdbfe", label: "OPEN" },
        ].map(({ color, border, text, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-8 h-4 rounded text-center text-[10px] font-bold flex items-center justify-center"
              style={{ backgroundColor: color, border: `1px solid ${border}`, color: text }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
