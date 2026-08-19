"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Trade } from "@/app/generated/prisma/client";

const inputCls =
  "w-full bg-[#111] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
const labelCls =
  "block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wide";

async function readError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.error ?? `Server error (${res.status})`;
  } catch {
    return `Server error (${res.status})`;
  }
}

function parseFeeExpr(expr: string): number | null {
  const clean = expr.trim();
  if (!clean) return 0;
  if (!/^[\d\s.+\-]+$/.test(clean)) return null;
  const tokens = clean.split(/(?=[-+])/).map((s) => s.trim()).filter(Boolean);
  const values = tokens.map(Number);
  if (values.some(isNaN)) return null;
  return values.reduce((a, b) => a + b, 0);
}

function toDateValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().split("T")[0];
}

export default function EditTradeForm({ trade }: { trade: Trade }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isStock = trade.tradeKind === "STOCK";

  const [feeExpr, setFeeExpr] = useState(trade.tradeFee != null ? String(trade.tradeFee) : "");
  const [feeParseError, setFeeParseError] = useState(false);
  const [vatExpr, setVatExpr] = useState(trade.vatAmount != null ? String(trade.vatAmount) : "");

  const [exitFeeExpr, setExitFeeExpr] = useState(trade.exitFee != null ? String(trade.exitFee) : "");
  const [exitFeeParseError, setExitFeeParseError] = useState(false);
  const [exitVatExpr, setExitVatExpr] = useState(trade.exitVatAmount != null ? String(trade.exitVatAmount) : "");

  const parsedFee = parseFeeExpr(feeExpr);
  const parsedExitFee = parseFeeExpr(exitFeeExpr);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const computedFee = parseFeeExpr(feeExpr);
    if (computedFee === null) { setFeeParseError(true); return; }
    setFeeParseError(false);

    if (trade.status === "CLOSED") {
      const computedExitFee = parseFeeExpr(exitFeeExpr);
      if (computedExitFee === null) { setExitFeeParseError(true); return; }
      setExitFeeParseError(false);
    }

    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd) as Record<string, string>;
    data.tradeFee = String(computedFee);
    if (isStock) {
      data.vatAmount = String(parseFeeExpr(vatExpr) ?? 0);
    }
    delete data.tradeFee_expr;

    if (trade.status === "CLOSED") {
      data.exitFee = String(parseFeeExpr(exitFeeExpr) ?? 0);
      if (isStock) {
        data.exitVatAmount = String(parseFeeExpr(exitVatExpr) ?? 0);
      }
      delete data.exitFee_expr;
    }

    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readError(res));
      router.push(`/trades/${trade.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Kind indicator (read-only) */}
      <div>
        <label className={labelCls}>Trade Type</label>
        <div className="flex gap-2">
          <span className={`px-5 py-2 rounded-md text-sm font-semibold border ${
            isStock
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-purple-500/10 border-purple-500/30 text-purple-400"
          }`}>
            {isStock ? "STOCK" : "OPTION"}
          </span>
          <span className="text-xs text-neutral-600 self-center">Cannot be changed after creation</span>
        </div>
      </div>

      {isStock ? (
        /* ── STOCK fields ── */
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Stock Symbol</label>
              <input name="ticker" type="text" required defaultValue={trade.ticker}
                placeholder="AAPL" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Shares</label>
              <input name="contracts" type="number" step="0.0000001" required
                defaultValue={trade.contracts ?? 1} placeholder="100" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Executed Price (per share)</label>
              <input name="executedPrice" type="number" step="0.0001"
                defaultValue={trade.executedPrice ?? trade.premiumPaid}
                placeholder="185.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Executed Date</label>
              <input name="transactionDate" type="date" required
                defaultValue={toDateValue(trade.entryDate)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Commission Fee</label>
              <input type="text" name="tradeFee_expr" value={feeExpr}
                onChange={(e) => { setFeeExpr(e.target.value); setFeeParseError(false); }}
                placeholder="0.00"
                className={`${inputCls} ${feeParseError ? "border-red-500/60 ring-1 ring-red-500/30" : ""}`}
              />
              {feeParseError && <span className="text-xs text-red-400 mt-1">Invalid expression</span>}
              {!feeParseError && parsedFee !== null && feeExpr.trim() !== "" && (
                <span className="text-xs text-neutral-500 mt-1">= <span className="text-green-400">${parsedFee.toFixed(4)}</span></span>
              )}
            </div>
            <div>
              <label className={labelCls}>VAT 7%</label>
              <input type="text" value={vatExpr} onChange={(e) => setVatExpr(e.target.value)}
                placeholder="0.00" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Reason to Buy <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
            <textarea name="tradeSetup" rows={3} defaultValue={trade.tradeSetup ?? ""}
              placeholder="e.g. Strong earnings, breakout…" className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Notes <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
            <textarea name="notes" rows={2} defaultValue={trade.notes ?? ""}
              placeholder="Optional notes…" className={`${inputCls} resize-none`} />
          </div>
        </>
      ) : (
        /* ── OPTION fields ── */
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ticker</label>
              <input name="ticker" type="text" required defaultValue={trade.ticker}
                placeholder="AAPL" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select name="type" required defaultValue={trade.type ?? "CALL"}
                className={`${inputCls} appearance-none`}>
                <option value="CALL" style={{ background: "#111" }}>CALL</option>
                <option value="PUT"  style={{ background: "#111" }}>PUT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className={labelCls}>Contract # <span className="ml-1.5 normal-case text-neutral-600 font-normal">(1cont.=100shares)</span></label>
              <input name="contracts" type="number" step="1" required
                defaultValue={trade.contracts ?? 1} placeholder="1" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Strike Price</label>
              <input name="strike" type="number" step="0.01" required
                defaultValue={trade.strike ?? ""} placeholder="200.00" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Executed Price <span className="ml-1.5 normal-case text-neutral-600 font-normal">(actual fill price)</span></label>
              <input name="executedPrice" type="number" step="0.0001"
                defaultValue={trade.executedPrice ?? trade.premiumPaid}
                placeholder="3.50" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expiry Date</label>
              <input name="expiry" type="date" required
                defaultValue={toDateValue(trade.expiry)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Stock Price <span className="ml-1.5 normal-case text-neutral-600 font-normal">(underlying stock price at entry)</span></label>
            <input name="stockPrice" type="number" step="0.01"
              defaultValue={trade.stockPrice ?? ""} placeholder="185.00" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Transaction Date</label>
            <input name="transactionDate" type="date" required
              defaultValue={toDateValue(trade.entryDate)} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Trade Fee <span className="ml-1.5 normal-case text-neutral-600 font-normal">(math ok: 0.55+0.03)</span></label>
            <input type="text" name="tradeFee_expr" value={feeExpr}
              onChange={(e) => { setFeeExpr(e.target.value); setFeeParseError(false); }}
              placeholder="0.55+0.03"
              className={`${inputCls} ${feeParseError ? "border-red-500/60 ring-1 ring-red-500/30" : ""}`}
            />
            <div className="mt-1.5 min-h-[18px]">
              {feeParseError ? (
                <span className="text-xs text-red-400">Invalid expression — use numbers with + or −</span>
              ) : parsedFee !== null && feeExpr.trim() !== "" ? (
                <span className="text-xs text-neutral-500">= <span className="text-green-400 font-semibold tabular-nums">${parsedFee.toFixed(4)}</span></span>
              ) : null}
            </div>
          </div>

          <div>
            <label className={labelCls}>Trade Setup <span className="ml-1.5 normal-case text-neutral-600 font-normal">(why did you enter?)</span></label>
            <textarea name="tradeSetup" rows={3} defaultValue={trade.tradeSetup ?? ""}
              placeholder="e.g. Earnings play, IV crush…" className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Notes <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
            <textarea name="notes" rows={3} defaultValue={trade.notes ?? ""}
              placeholder="Optional notes…" className={`${inputCls} resize-none`} />
          </div>
        </>
      )}

      {/* ── Close details (only for CLOSED trades) ── */}
      {trade.status === "CLOSED" && (
        <div className="border-t border-[#2a2a2a] pt-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
            {isStock ? "Sale Details" : "Close Details"}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>{isStock ? "Sell Price (per share)" : "Exit Price (per share)"}</label>
              <input name="exitPrice" type="number" step="0.01"
                defaultValue={trade.exitPrice ?? ""} placeholder="5.20" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{isStock ? "Sell Date" : "Exit Date"}</label>
              <input name="exitDate" type="date"
                defaultValue={toDateValue(trade.exitDate)} className={inputCls} />
            </div>
          </div>

          {isStock ? (
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className={labelCls}>Exit Commission</label>
                <input type="text" name="exitFee_expr" value={exitFeeExpr}
                  onChange={(e) => { setExitFeeExpr(e.target.value); setExitFeeParseError(false); }}
                  placeholder="0.00"
                  className={`${inputCls} ${exitFeeParseError ? "border-red-500/60 ring-1 ring-red-500/30" : ""}`}
                />
              </div>
              <div>
                <label className={labelCls}>Exit VAT 7%</label>
                <input type="text" value={exitVatExpr} onChange={(e) => setExitVatExpr(e.target.value)}
                  placeholder="0.00" className={inputCls} />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <label className={labelCls}>Stock Price at Exit <span className="ml-1.5 normal-case text-neutral-600 font-normal">(underlying)</span></label>
                <input name="stockPriceAtExit" type="number" step="0.01"
                  defaultValue={trade.stockPriceAtExit ?? ""} placeholder="210.00" className={inputCls} />
              </div>

              <div className="mb-5">
                <label className={labelCls}>Exit Fee <span className="ml-1.5 normal-case text-neutral-600 font-normal">(math ok: 0.55+0.03)</span></label>
                <input type="text" name="exitFee_expr" value={exitFeeExpr}
                  onChange={(e) => { setExitFeeExpr(e.target.value); setExitFeeParseError(false); }}
                  placeholder="0.55+0.03"
                  className={`${inputCls} ${exitFeeParseError ? "border-red-500/60 ring-1 ring-red-500/30" : ""}`}
                />
                <div className="mt-1.5 min-h-[18px]">
                  {exitFeeParseError ? (
                    <span className="text-xs text-red-400">Invalid expression — use numbers with + or −</span>
                  ) : parsedExitFee !== null && exitFeeExpr.trim() !== "" ? (
                    <span className="text-xs text-neutral-500">= <span className="text-green-400 font-semibold tabular-nums">${parsedExitFee.toFixed(4)}</span></span>
                  ) : null}
                </div>
              </div>
            </>
          )}

          <div className="mb-5">
            <label className={labelCls}>{isStock ? "Reason to Sell" : "Close Reason"} <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
            <input name="closeReason" type="text" defaultValue={trade.closeReason ?? ""}
              placeholder="e.g. Target reached, stop loss hit…" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Lesson Learnt <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
            <textarea name="lessonLearnt" rows={3} defaultValue={trade.lessonLearnt ?? ""}
              placeholder="What did this trade teach you?" className={`${inputCls} resize-none`} />
          </div>
        </div>
      )}

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-6 py-2.5 text-sm font-semibold transition-colors cursor-pointer">
          {loading ? "Saving…" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border border-[#2a2a2a] text-neutral-400 hover:text-white rounded-md px-6 py-2.5 text-sm font-medium transition-colors cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}
