"use client";

import { useEffect, useState } from "react";

const inputCls =
  "w-full bg-[#111] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
const labelCls =
  "block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wide";

export default function SettingsPage() {
  const [startCapital, setStartCapital] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setStartCapital(String(data.startCapital ?? ""));
          setStartDate(data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "");
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startCapital: Number(startCapital), startDate }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Failed to save");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-neutral-500 text-sm mt-1">Portfolio configuration</p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 max-w-lg">
        <h2 className="text-sm font-semibold text-white mb-5">Portfolio Starting Point</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Starting Capital (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={startCapital}
              onChange={(e) => setStartCapital(e.target.value)}
              placeholder="10000.00"
              className={inputCls}
            />
            <p className="text-xs text-neutral-600 mt-1">
              The total capital you started trading with
            </p>
          </div>

          <div>
            <label className={labelCls}>Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-neutral-600 mt-1">
              The date you began tracking your portfolio
            </p>
          </div>

          {error && (
            <p className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          )}

          {saved && (
            <p className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-md px-3 py-2 text-sm">
              Settings saved.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-6 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
          >
            {loading ? "Saving…" : "Save Settings"}
          </button>
        </form>
      </div>
    </>
  );
}
