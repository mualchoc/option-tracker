import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TradeTable from "@/components/TradeTable";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const trades = await prisma.trade.findMany({ orderBy: { entryDate: "desc" } });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade History</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{trades.length} total trades</p>
        </div>
        <Link
          href="/trades/new"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
        >
          + Log New Trade
        </Link>
      </div>
      <TradeTable trades={trades} />
    </>
  );
}
