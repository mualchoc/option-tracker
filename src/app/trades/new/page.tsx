import Link from "next/link";
import TradeForm from "@/components/TradeForm";

export default function NewTradePage() {
  return (
    <div className="max-w-lg mx-auto">
      <Link href="/trades" className="text-sm text-neutral-500 hover:text-white transition-colors mb-6 inline-block">
        ← Back to trades
      </Link>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
        <h1 className="text-xl font-bold text-white mb-6">Log New Trade</h1>
        <TradeForm mode="new" />
      </div>
    </div>
  );
}
