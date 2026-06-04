"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MonthlyFuel } from "@/app/generated/prisma/client";

const inputCls =
  "bg-[#111] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full tabular-nums";

export default function FuelTableRow({ fuel, index }: { fuel: MonthlyFuel; index: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [month, setMonth] = useState(fuel.month);
  const [yieldReceived, setYieldReceived] = useState(String(fuel.yieldReceived));
  const [deployed, setDeployed] = useState(String(fuel.deployed));
  const [reinvestedBack, setReinvestedBack] = useState(String(fuel.reinvestedBack));

  const remaining = fuel.yieldReceived - fuel.deployed;

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/fuel/${fuel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month,
        yieldReceived: Number(yieldReceived),
        deployed: Number(deployed),
        reinvestedBack: Number(reinvestedBack),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  function handleCancel() {
    setMonth(fuel.month);
    setYieldReceived(String(fuel.yieldReceived));
    setDeployed(String(fuel.deployed));
    setReinvestedBack(String(fuel.reinvestedBack));
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete fuel entry for ${fuel.month}?`)) return;
    setDeleting(true);
    await fetch(`/api/fuel/${fuel.id}`, { method: "DELETE" });
    router.refresh();
  }

  const rowBase = `border-b border-[#2a2a2a] transition-colors ${
    index % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#1e1e1e]"
  }`;

  if (editing) {
    return (
      <tr className={rowBase}>
        <td className="px-4 py-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={inputCls}
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            step="0.01"
            value={yieldReceived}
            onChange={(e) => setYieldReceived(e.target.value)}
            className={inputCls}
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            step="0.01"
            value={deployed}
            onChange={(e) => setDeployed(e.target.value)}
            className={inputCls}
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            step="0.01"
            value={reinvestedBack}
            onChange={(e) => setReinvestedBack(e.target.value)}
            className={inputCls}
          />
        </td>
        <td className="px-4 py-2 text-neutral-600 tabular-nums text-xs">—</td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 rounded px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="border border-[#2a2a2a] text-neutral-400 hover:text-white rounded px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`${rowBase} hover:bg-[#222]`}>
      <td className="px-4 py-3 font-semibold text-white tabular-nums">{fuel.month}</td>
      <td className="px-4 py-3 text-green-400 font-medium tabular-nums">
        ${fuel.yieldReceived.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-blue-400 font-medium tabular-nums">
        ${fuel.deployed.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-purple-400 font-medium tabular-nums">
        ${fuel.reinvestedBack.toFixed(2)}
      </td>
      <td
        className={`px-4 py-3 font-semibold tabular-nums ${
          remaining >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        ${remaining.toFixed(2)}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 rounded px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}
