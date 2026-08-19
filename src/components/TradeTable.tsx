"use client";

import { useState } from "react";
import Link from "next/link";
import type { Trade } from "@/app/generated/prisma/client";

interface Props {
  trades: Trade[];
}

type Tab = "OPTION" | "STOCK";

const thCls = "px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-left whitespace-nowrap";
const tdBase = "px-4 py-3";

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

function pnlColor(t: Trade) {
  if (t.status === "OPEN") return "text-neutral-600";
  return (t.pnl ?? 0) > 0 ? "text-green-400 font-semibold" : "text-red-400 font-semibold";
}

function rowCls(i: number) {
  return `border-b border-[#2a2a2a] hover:bg-[#222] transition-colors ${
    i % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#1e1e1e]"
  }`;
}

function OptionRow({ t, i }: { t: Trade; i: number }) {
  const color = pnlColor(t);
  const entryPrice = t.executedPrice ?? t.premiumPaid;
  return (
    <tr className={rowCls(i)}>
      <td className={`${tdBase} font-semibold whitespace-nowrap`}>
        <Link href={`/trades/${t.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
          {t.ticker}
        </Link>
      </td>
      <td className={tdBase}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
          t.type === "CALL"
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {t.type ?? "—"}
        </span>
      </td>
      <td className={`${tdBase} text-neutral-300 tabular-nums`}>
        {t.strike != null ? `$${t.strike}` : "—"}
      </td>
      <td className={`${tdBase} text-neutral-500 tabular-nums whitespace-nowrap`}>
        {t.expiry ? new Date(t.expiry).toLocaleDateString("en-US") : "—"}
      </td>
      <td className={`${tdBase} text-neutral-300 tabular-nums`}>
        {t.contracts ?? 1}
      </td>
      <td className={`${tdBase} text-neutral-300 tabular-nums`}>
        ${entryPrice?.toFixed(4) ?? "—"}
      </td>
      <td className={`${tdBase} text-neutral-500 tabular-nums whitespace-nowrap`}>
        {new Date(t.entryDate).toLocaleDateString("en-US")}
      </td>
      <td className={tdBase}><StatusBadge trade={t} /></td>
      <td className={`${tdBase} tabular-nums ${color}`}>
        {t.pnl != null ? `$${t.pnl.toFixed(2)}` : "—"}
      </td>
      <td className={`${tdBase} tabular-nums ${color}`}>
        {t.returnPct != null ? `${t.returnPct.toFixed(1)}%` : "—"}
      </td>
    </tr>
  );
}

function StockRow({ t, i }: { t: Trade; i: number }) {
  const color = pnlColor(t);
  const entryPrice = t.executedPrice ?? t.premiumPaid;
  return (
    <tr className={rowCls(i)}>
      <td className={`${tdBase} font-semibold whitespace-nowrap`}>
        <Link href={`/trades/${t.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
          {t.ticker}
        </Link>
      </td>
      <td className={`${tdBase} text-neutral-300 tabular-nums`}>
        {t.contracts ?? 1}
      </td>
      <td className={`${tdBase} text-neutral-300 tabular-nums`}>
        ${entryPrice?.toFixed(4) ?? "—"}
      </td>
      <td className={`${tdBase} text-neutral-500 tabular-nums whitespace-nowrap`}>
        {new Date(t.entryDate).toLocaleDateString("en-US")}
      </td>
      <td className={`${tdBase} text-neutral-300 tabular-nums`}>
        {t.exitPrice != null ? `$${t.exitPrice.toFixed(4)}` : "—"}
      </td>
      <td className={`${tdBase} text-neutral-500 tabular-nums whitespace-nowrap`}>
        {t.exitDate ? new Date(t.exitDate).toLocaleDateString("en-US") : "—"}
      </td>
      <td className={`${tdBase} text-neutral-500 tabular-nums`}>
        {t.holdDays != null ? `${t.holdDays}d` : "—"}
      </td>
      <td className={tdBase}><StatusBadge trade={t} /></td>
      <td className={`${tdBase} tabular-nums ${color}`}>
        {t.pnl != null ? `$${t.pnl.toFixed(2)}` : "—"}
      </td>
    </tr>
  );
}

export default function TradeTable({ trades }: Props) {
  const [tab, setTab] = useState<Tab>("OPTION");

  const optionTrades = trades.filter((t) => t.tradeKind !== "STOCK");
  const stockTrades  = trades.filter((t) => t.tradeKind === "STOCK");
  const displayed    = tab === "OPTION" ? optionTrades : stockTrades;

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(["OPTION", "STOCK"] as Tab[]).map((t) => {
          const count = t === "OPTION" ? optionTrades.length : stockTrades.length;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors cursor-pointer ${
                active
                  ? "bg-[#2a2a2a] text-white border-[#3a3a3a]"
                  : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              {t === "OPTION" ? "Options" : "Stocks"} ({count})
            </button>
          );
        })}
      </div>

      {/* Table or empty state */}
      {displayed.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
          <p className="text-neutral-500 text-sm">
            No {tab === "OPTION" ? "option" : "stock"} trades yet.{" "}
            <Link href="/trades/new" className="text-blue-400 hover:text-blue-300">
              Log your first {tab === "OPTION" ? "option" : "stock"} trade.
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
          <table className="w-full text-sm">
            <thead className="bg-[#111] border-b border-[#2a2a2a]">
              {tab === "OPTION" ? (
                <tr>
                  {["Ticker", "Type", "Strike", "Expiry", "Contracts", "Entry Price", "Entry Date", "Status", "P&L", "Return %"].map((h) => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              ) : (
                <tr>
                  {["Ticker", "Shares", "Entry Price", "Entry Date", "Exit Price", "Exit Date", "Hold", "Status", "P&L"].map((h) => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {displayed.map((t, i) =>
                tab === "OPTION"
                  ? <OptionRow key={t.id} t={t} i={i} />
                  : <StockRow  key={t.id} t={t} i={i} />
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
