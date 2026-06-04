"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputCls =
  "bg-[#111] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-full";

const labelCls = "block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wide";

export default function AddFuelForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to save");
    } else {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      <div className="min-w-[140px]">
        <label className={labelCls}>Month</label>
        <input name="month" type="month" required className={inputCls} />
      </div>
      <div className="min-w-[140px]">
        <label className={labelCls}>Yield Received ($)</label>
        <input name="yieldReceived" type="number" step="0.01" required placeholder="0.00" className={inputCls} />
      </div>
      <div className="min-w-[140px]">
        <label className={labelCls}>Deployed ($)</label>
        <input name="deployed" type="number" step="0.01" required placeholder="0.00" className={inputCls} />
      </div>
      <div className="min-w-[140px]">
        <label className={labelCls}>Reinvested Back ($)</label>
        <input name="reinvestedBack" type="number" step="0.01" required placeholder="0.00" className={inputCls} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors cursor-pointer"
      >
        {loading ? "Saving…" : "Add Entry"}
      </button>
      {error && <span className="text-red-400 text-xs self-center">{error}</span>}
    </form>
  );
}
