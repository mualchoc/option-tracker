import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EditTradeForm from "@/components/EditTradeForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTradePage({ params }: Props) {
  const { id } = await params;
  const trade = await prisma.trade.findUnique({ where: { id: Number(id) } });

  if (!trade) notFound();

  return (
    <>
      <Link
        href={`/trades/${trade.id}`}
        className="text-sm text-neutral-500 hover:text-white transition-colors mb-5 inline-block"
      >
        ← Back to trade
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Edit Trade — {trade.ticker} {trade.type} ${trade.strike}
        </h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Fix errors or add notes to this trade
        </p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <EditTradeForm trade={trade} />
      </div>
    </>
  );
}
