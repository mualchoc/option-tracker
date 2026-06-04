import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TradeForm from "@/components/TradeForm";
import DeleteTradeButton from "@/components/DeleteTradeButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TradePage({ params }: Props) {
  const { id } = await params;
  const trade = await prisma.trade.findUnique({ where: { id: Number(id) } });

  if (!trade) notFound();

  const detailItems: [string, string][] = [
    ["Ticker", trade.ticker],
    ["Type", trade.type],
    ["Contracts", String(trade.contracts ?? 1)],
    ["Strike", `$${trade.strike}`],
    ...(trade.executedPrice != null ? [["Executed Price", `$${trade.executedPrice}`] as [string, string]] : []),
    ["Expiry", new Date(trade.expiry).toLocaleDateString("en-US")],
    ["Exec. Price", `$${trade.premiumPaid}`],
    ["Transaction Date", new Date(trade.entryDate).toLocaleDateString("en-US")],
    ...(trade.tradeFee != null ? [["Trade Fee", `$${trade.tradeFee.toFixed(4)}`] as [string, string]] : []),
    ...(trade.stockPrice != null ? [["Stock Price (entry)", `$${trade.stockPrice.toFixed(2)}`] as [string, string]] : []),
    ...(trade.exitDate ? [["Exit Date", new Date(trade.exitDate).toLocaleDateString("en-US")] as [string, string]] : []),
    ...(trade.holdDays != null ? [["Hold Days", `${trade.holdDays}d`] as [string, string]] : []),
    ...(trade.exitFee != null ? [["Exit Fee", `$${trade.exitFee.toFixed(4)}`] as [string, string]] : []),
    ...(trade.stockPriceAtExit != null ? [["Stock Price (exit)", `$${trade.stockPriceAtExit.toFixed(2)}`] as [string, string]] : []),
  ];

  return (
    <>
      <Link href="/trades" className="text-sm text-neutral-500 hover:text-white transition-colors mb-5 inline-block">
        ← Back to trades
      </Link>

      {/* Heading */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-white">
          {trade.ticker} — {trade.type} ${trade.strike}
        </h1>
        {trade.status === "OPEN" ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            OPEN
          </span>
        ) : (trade.pnl ?? 0) >= 0 ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
            WIN
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            LOSS
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Link
            href={`/trades/${trade.id}/edit`}
            className="border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
          >
            Edit
          </Link>
          <DeleteTradeButton tradeId={trade.id} />
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {detailItems.map(([label, value]) => (
          <div key={label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1.5">
              {label}
            </p>
            <p className="text-sm font-semibold text-white tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* P&L result cards */}
      {trade.status === "CLOSED" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {trade.pnl != null && (
            <div
              className={`rounded-xl p-4 border ${
                trade.pnl >= 0
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">P&amp;L</p>
              <p className={`text-2xl font-bold tabular-nums ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                ${trade.pnl.toFixed(2)}
              </p>
            </div>
          )}
          {trade.returnPct != null && (
            <div
              className={`rounded-xl p-4 border ${
                trade.returnPct >= 0
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">Return</p>
              <p className={`text-2xl font-bold tabular-nums ${trade.returnPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                {trade.returnPct.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trade Setup */}
      {trade.tradeSetup && (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3 mb-3">
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-1">Trade Setup</p>
          <p className="text-sm text-neutral-300">{trade.tradeSetup}</p>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3 mb-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-1">Notes</p>
          <p className="text-sm text-neutral-400">{trade.notes}</p>
        </div>
      )}

      {/* Close Reason */}
      {trade.closeReason && (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3 mb-3">
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-1">Close Reason</p>
          <p className="text-sm text-neutral-300">{trade.closeReason}</p>
        </div>
      )}

      {/* Lesson Learnt */}
      {trade.lessonLearnt && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 mb-5">
          <p className="text-xs text-amber-500/80 uppercase tracking-wide font-medium mb-1">Lesson Learnt</p>
          <p className="text-sm text-amber-200/80">{trade.lessonLearnt}</p>
        </div>
      )}

      {/* Reinvest suggestion */}
      {trade.status === "CLOSED" && trade.reinvestSuggestion != null && trade.reinvestSuggestion > 0 && (
        <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4 mb-6">
          <span className="text-xl leading-none mt-0.5">💡</span>
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">Reinvest Suggestion</p>
            <p className="text-sm text-green-300">
              Consider reinvesting{" "}
              <span className="font-bold text-green-400">${trade.reinvestSuggestion.toFixed(2)}</span>{" "}
              — 10% of this trade&apos;s P&amp;L — into your next position.
            </p>
          </div>
        </div>
      )}

      {/* Close trade form */}
      {trade.status === "OPEN" && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">Close This Trade</h2>
          <TradeForm mode="close" trade={trade} />
        </div>
      )}
    </>
  );
}
