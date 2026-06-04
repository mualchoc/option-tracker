"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteTradeButton({ tradeId }: { tradeId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this trade? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/trades/${tradeId}`, { method: "DELETE" });
    router.push("/trades");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
