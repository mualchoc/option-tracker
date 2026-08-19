"use client";

import { useEffect, useState } from "react";

const inputCls =
  "w-full bg-[#111] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
const labelCls =
  "block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wide";

const today = new Date().toISOString().split("T")[0];

type CashFlow = {
  id: number;
  type: "IN" | "OUT";
  amount: number;
  date: string;
  note: string | null;
};

export default function SettingsPage() {
  // ── Portfolio config ──
  const [startCapital, setStartCapital] = useState("");
  const [startDate, setStartDate] = useState("");
  const [configNote, setConfigNote] = useState("");
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // ── Cash flows ──
  const [flows, setFlows] = useState<CashFlow[]>([]);
  const [flowType, setFlowType] = useState<"IN" | "OUT">("IN");
  const [flowAmount, setFlowAmount] = useState("");
  const [flowDate, setFlowDate] = useState(today);
  const [flowNote, setFlowNote] = useState("");
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setStartCapital(String(data.startCapital ?? ""));
          setStartDate(data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "");
          setConfigNote(data.note ?? "");
        }
      });

    fetch("/api/cashflows")
      .then((r) => r.json())
      .then(setFlows);
  }, []);

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setConfigError(null);
    setConfigSaved(false);
    setConfigLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startCapital: Number(startCapital), startDate, note: configNote }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      setConfigSaved(true);
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setConfigLoading(false);
    }
  }

  async function addFlow(e: React.FormEvent) {
    e.preventDefault();
    setFlowError(null);
    setFlowLoading(true);
    try {
      const res = await fetch("/api/cashflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: flowType,
          amount: Number(flowAmount),
          date: flowDate,
          note: flowNote || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to add");
      const created = await res.json();
      setFlows((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      setFlowAmount("");
      setFlowNote("");
      setFlowDate(today);
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFlowLoading(false);
    }
  }

  async function deleteFlow(id: number) {
    await fetch(`/api/cashflows/${id}`, { method: "DELETE" });
    setFlows((prev) => prev.filter((f) => f.id !== id));
  }

  // Net capital = startCapital + all IN - all OUT
  const netCapital =
    (Number(startCapital) || 0) +
    flows.reduce((s, f) => s + (f.type === "IN" ? f.amount : -f.amount), 0);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-neutral-500 text-sm mt-1">Portfolio configuration</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* ── Starting Point ── */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Portfolio Starting Point</h2>
          <form onSubmit={saveConfig} className="space-y-4">
            <div>
              <label className={labelCls}>Starting Capital (USD)</label>
              <input
                type="number" step="0.01" min="0" required
                value={startCapital} onChange={(e) => setStartCapital(e.target.value)}
                placeholder="10000.00" className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Start Date</label>
              <input
                type="date" required
                value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Note <span className="normal-case text-neutral-600 font-normal">(optional)</span></label>
              <textarea
                rows={2}
                value={configNote} onChange={(e) => setConfigNote(e.target.value)}
                placeholder="e.g. Initial portfolio funded from savings…"
                className={`${inputCls} resize-none`}
              />
            </div>
            {configError && (
              <p className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-3 py-2 text-sm">{configError}</p>
            )}
            {configSaved && (
              <p className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-md px-3 py-2 text-sm">Settings saved.</p>
            )}
            <button type="submit" disabled={configLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-5 py-2 text-sm font-semibold transition-colors cursor-pointer">
              {configLoading ? "Saving…" : "Save Settings"}
            </button>
          </form>
        </div>

        {/* ── Cash In / Cash Out ── */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Capital Events</h2>
            {startCapital && (
              <div className="text-right">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Effective Capital</p>
                <p className={`text-lg font-bold tabular-nums ${netCapital >= 0 ? "text-white" : "text-red-400"}`}>
                  ${netCapital.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Add event form */}
          <form onSubmit={addFlow} className="space-y-4 mb-6">
            <div className="flex gap-2">
              {(["IN", "OUT"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setFlowType(t)}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold border transition-colors cursor-pointer ${
                    flowType === t
                      ? t === "IN"
                        ? "bg-green-500/15 border-green-500/30 text-green-400"
                        : "bg-red-500/15 border-red-500/30 text-red-400"
                      : "bg-[#111] border-[#2a2a2a] text-neutral-500 hover:text-neutral-300"
                  }`}>
                  {t === "IN" ? "Cash In" : "Cash Out"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Amount (USD)</label>
                <input
                  type="number" step="0.01" min="0.01" required
                  value={flowAmount} onChange={(e) => setFlowAmount(e.target.value)}
                  placeholder="5000.00" className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input
                  type="date" required
                  value={flowDate} onChange={(e) => setFlowDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Note <span className="normal-case text-neutral-600 font-normal">(optional)</span></label>
              <input
                type="text"
                value={flowNote} onChange={(e) => setFlowNote(e.target.value)}
                placeholder="e.g. Monthly top-up, Withdrawal for expenses…"
                className={inputCls}
              />
            </div>

            {flowError && (
              <p className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-3 py-2 text-sm">{flowError}</p>
            )}

            <button type="submit" disabled={flowLoading}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                flowType === "IN"
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}>
              {flowLoading ? "Adding…" : flowType === "IN" ? "+ Add Cash In" : "− Add Cash Out"}
            </button>
          </form>

          {/* Event log */}
          {flows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[#2a2a2a]">
              <table className="w-full text-sm">
                <thead className="bg-[#111] border-b border-[#2a2a2a]">
                  <tr>
                    {["Date", "Type", "Amount", "Note", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flows.map((f, i) => (
                    <tr key={f.id} className={`border-b border-[#2a2a2a] ${i % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#1e1e1e]"}`}>
                      <td className="px-4 py-2.5 text-neutral-400 tabular-nums whitespace-nowrap">
                        {new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          f.type === "IN"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {f.type === "IN" ? "Cash In" : "Cash Out"}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 tabular-nums font-semibold ${f.type === "IN" ? "text-green-400" : "text-red-400"}`}>
                        {f.type === "IN" ? "+" : "−"}${f.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-500 text-xs">{f.note ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => deleteFlow(f.id)}
                          className="text-neutral-600 hover:text-red-400 transition-colors text-xs cursor-pointer">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-neutral-600 text-sm text-center py-4">No capital events yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
