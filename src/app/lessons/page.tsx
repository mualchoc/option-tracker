import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const trades = await prisma.trade.findMany({
    where: { status: "CLOSED" },
    orderBy: { exitDate: "desc" },
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Lesson Learnt</h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Post-mortem review of all closed trades
        </p>
      </div>

      {trades.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-10 text-center text-neutral-600 text-sm">
          No closed trades yet. Lessons will appear here after you close a trade.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trades.map((trade) => {
            const isWin = (trade.pnl ?? 0) >= 0;
            return (
              <Link
                key={trade.id}
                href={`/trades/${trade.id}`}
                className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-neutral-600 transition-colors group"
              >
                {/* Header row */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <h2 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    {trade.ticker}
                    {trade.tradeKind !== "STOCK" && trade.type ? ` ${trade.type}` : ""}
                    {trade.strike != null ? ` $${trade.strike}` : ""}
                  </h2>

                  {/* WIN / LOSS badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      isWin
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {isWin ? "WIN" : "LOSS"}
                  </span>

                  {/* P&L */}
                  {trade.pnl != null && (
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isWin ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isWin ? "+" : ""}${trade.pnl.toFixed(2)}
                    </span>
                  )}

                  {/* Exit date */}
                  {trade.exitDate && (
                    <span className="ml-auto text-xs text-neutral-600 tabular-nums">
                      Closed {new Date(trade.exitDate).toLocaleDateString("en-US")}
                    </span>
                  )}
                </div>

                {/* 3-column grid: Setup | Exit | Lesson */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Why I entered */}
                  <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-1.5">
                      Why I entered
                    </p>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      {trade.tradeSetup || <span className="text-neutral-600">—</span>}
                    </p>
                  </div>

                  {/* Why I exited */}
                  <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-1.5">
                      Why I exited
                    </p>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      {trade.closeReason || <span className="text-neutral-600">—</span>}
                    </p>
                  </div>

                  {/* Lesson learnt */}
                  <div
                    className={`rounded-lg px-4 py-3 border ${
                      trade.lessonLearnt
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-[#111] border-[#2a2a2a]"
                    }`}
                  >
                    <p
                      className={`text-xs uppercase tracking-wide font-medium mb-1.5 ${
                        trade.lessonLearnt ? "text-amber-500/80" : "text-neutral-500"
                      }`}
                    >
                      Lesson Learnt
                    </p>
                    <p
                      className={`text-sm leading-relaxed ${
                        trade.lessonLearnt ? "text-amber-200/80" : "text-neutral-600"
                      }`}
                    >
                      {trade.lessonLearnt || "—"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
