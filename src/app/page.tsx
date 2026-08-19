import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EquityCurveChart from "@/components/EquityCurveChart";
import OpenPositions from "@/components/OpenPositions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const trades = await prisma.trade.findMany({ orderBy: { entryDate: "desc" } });
  const openTrades = trades.filter((t) => t.status === "OPEN");

  return (
    <>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Trade Tracker</h1>
          <p className="text-neutral-500 text-sm mt-1">Options &amp; stocks, all in one place</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/trades"
            className="border border-[#2a2a2a] text-neutral-400 hover:text-white hover:border-neutral-500 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            All Trades →
          </Link>
          <Link
            href="/trades/new"
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          >
            + New Trade
          </Link>
        </div>
      </div>

      <EquityCurveChart trades={trades} />

      <OpenPositions trades={openTrades} />
    </>
  );
}
