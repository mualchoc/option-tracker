import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatsCards from "@/components/StatsCards";
import PnLChart from "@/components/PnLChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [trades, fuel] = await Promise.all([
    prisma.trade.findMany({ orderBy: { entryDate: "desc" } }),
    prisma.monthlyFuel.findMany({ orderBy: { month: "desc" } }),
  ]);

  const recentTrades = trades.slice(0, 5);
  const latestFuel = fuel[0] ?? null;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Options Tracker</h1>
          <p className="text-neutral-500 text-sm mt-1">Powered by monthly yield</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/trades"
            className="border border-[#2a2a2a] text-neutral-400 hover:text-white hover:border-neutral-500 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            All Trades →
          </Link>
          <Link
            href="/fuel"
            className="border border-[#2a2a2a] text-neutral-400 hover:text-white hover:border-neutral-500 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            Fuel Log →
          </Link>
        </div>
      </div>

      <StatsCards trades={trades} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Recent Trades */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Recent Trades
            </h2>
            <Link href="/trades" className="text-xs text-blue-400 hover:text-blue-300">
              View all
            </Link>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            {recentTrades.length === 0 ? (
              <p className="text-neutral-600 text-sm p-6 text-center">
                No trades yet.{" "}
                <Link href="/trades/new" className="text-blue-400 hover:text-blue-300">
                  Log one.
                </Link>
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#111] border-b border-[#2a2a2a]">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-left">Ticker</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-left">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-left">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-left">P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t, i) => (
                    <tr
                      key={t.id}
                      className={`border-b border-[#2a2a2a] hover:bg-[#222] transition-colors ${
                        i % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#1e1e1e]"
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold">
                        <Link href={`/trades/${t.id}`} className="text-blue-400 hover:text-blue-300">
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
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            t.status === "OPEN"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : (t.pnl ?? 0) >= 0
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {t.status === "OPEN" ? "OPEN" : (t.pnl ?? 0) >= 0 ? "WIN" : "LOSS"}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 tabular-nums font-medium ${
                          t.status === "OPEN"
                            ? "text-neutral-600"
                            : (t.pnl ?? 0) > 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {t.pnl != null ? `$${t.pnl.toFixed(2)}` : "Open"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Latest Fuel */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Latest Fuel
            </h2>
            <Link href="/fuel" className="text-xs text-blue-400 hover:text-blue-300">
              View all
            </Link>
          </div>
          {latestFuel ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-3">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-[#2a2a2a] pb-3">
                {latestFuel.month}
              </p>
              {[
                { label: "Yield Received", value: latestFuel.yieldReceived, cls: "text-green-400" },
                { label: "Deployed", value: latestFuel.deployed, cls: "text-blue-400" },
                { label: "Reinvested Back", value: latestFuel.reinvestedBack, cls: "text-purple-400" },
                {
                  label: "Remaining",
                  value: latestFuel.yieldReceived - latestFuel.deployed,
                  cls: latestFuel.yieldReceived - latestFuel.deployed >= 0 ? "text-green-400" : "text-red-400",
                },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500">{label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${cls}`}>
                    ${value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 text-neutral-600 text-sm text-center">
              No fuel entries.{" "}
              <Link href="/fuel" className="text-blue-400 hover:text-blue-300">
                Add one.
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* P&L Chart */}
      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          P&amp;L by Trade
        </h2>
        <PnLChart trades={trades} />
      </div>
    </>
  );
}
