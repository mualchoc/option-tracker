import { prisma } from "@/lib/prisma";
import TradeCalendar from "@/components/TradeCalendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const trades = await prisma.trade.findMany({ orderBy: { entryDate: "asc" } });

  // Serialise dates to ISO strings so client component can receive them
  const serialised = trades.map((t) => ({
    id: t.id,
    ticker: t.ticker,
    type: t.type,
    strike: t.strike,
    entryDate: t.entryDate.toISOString(),
    exitDate: t.exitDate ? t.exitDate.toISOString() : null,
    status: t.status,
    pnl: t.pnl,
    holdDays: t.holdDays,
  }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Visual timeline of your trades across the month
        </p>
      </div>
      <TradeCalendar trades={serialised} />
    </>
  );
}
