"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Trade } from "@/app/generated/prisma/client";

type NewMode = { mode: "new" };
type CloseMode = { mode: "close"; trade: Trade };
type Props = NewMode | CloseMode;

const today = new Date().toISOString().split("T")[0];

const inputCls =
  "w-full bg-[#111] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

const labelCls = "block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wide";

async function readError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.error ?? `Server error (${res.status})`;
  } catch {
    return `Server error (${res.status})`;
  }
}

/** Parse a simple +/- expression like "0.55+0.03+0.03" → 0.61 */
function parseFeeExpr(expr: string): number | null {
  const clean = expr.trim();
  if (!clean) return 0;
  if (!/^[\d\s.+\-]+$/.test(clean)) return null;
  const tokens = clean.split(/(?=[-+])/).map((s) => s.trim()).filter(Boolean);
  const values = tokens.map(Number);
  if (values.some(isNaN)) return null;
  return values.reduce((a, b) => a + b, 0);
}

function Field({
  label,
  name,
  type,
  defaultValue,
  required = true,
  step,
  placeholder,
  hint,
  onChange,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue?: string | number;
  required?: boolean;
  step?: string;
  placeholder?: string;
  hint?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {hint && <span className="ml-1.5 normal-case text-neutral-600 font-normal">{hint}</span>}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        step={step}
        placeholder={placeholder}
        className={inputCls}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  );
}

export default function TradeForm(props: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reactive state for new-trade Total Cost preview
  const [contracts, setContracts] = useState(1);
  const [executedPrice, setExecutedPrice] = useState<number | null>(null);
  const [feeExpr, setFeeExpr] = useState("");
  const [feeParseError, setFeeParseError] = useState(false);

  const parsedFee = parseFeeExpr(feeExpr);
  const totalCost =
    executedPrice != null && parsedFee != null
      ? executedPrice * contracts * 100 + parsedFee
      : null;

  // Reactive state for close-trade Estimated Credit preview
  const [closeExitPrice, setCloseExitPrice] = useState<number | null>(null);
  const [exitFeeExpr, setExitFeeExpr] = useState("");
  const [exitFeeParseError, setExitFeeParseError] = useState(false);

  const parsedExitFee = parseFeeExpr(exitFeeExpr);
  const closeContracts = props.mode === "close" ? (props.trade.contracts ?? 1) : 1;
  const estimatedCredit =
    closeExitPrice != null && parsedExitFee != null
      ? closeExitPrice * closeContracts * 100 - parsedExitFee
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (props.mode === "new") {
      const computedFee = parseFeeExpr(feeExpr);
      if (computedFee === null) {
        setFeeParseError(true);
        return;
      }
      setFeeParseError(false);
      setLoading(true);

      const fd = new FormData(e.currentTarget);
      const data = Object.fromEntries(fd);
      // Replace raw fee expression string with computed numeric value
      data.tradeFee = String(computedFee);
      delete data.tradeFee_expr;

      try {
        const res = await fetch("/api/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await readError(res));
        router.push("/trades");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      }
    } else {
      const computedExitFee = parseFeeExpr(exitFeeExpr);
      if (computedExitFee === null) {
        setExitFeeParseError(true);
        return;
      }
      setExitFeeParseError(false);
      setLoading(true);

      const fd = new FormData(e.currentTarget);
      const data = Object.fromEntries(fd);
      data.exitFee = String(computedExitFee);
      delete data.exitFee_expr;

      try {
        const res = await fetch(`/api/trades/${(props as { mode: "close"; trade: { id: number } }).trade.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await readError(res));
        router.push("/trades");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {props.mode === "new" ? (
        <>
          {/* Ticker + Type */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ticker" name="ticker" type="text" placeholder="AAPL" />
            <div>
              <label className={labelCls}>Type</label>
              <select name="type" required className={`${inputCls} appearance-none`}>
                <option value="CALL" style={{ background: "#111" }}>CALL</option>
                <option value="PUT" style={{ background: "#111" }}>PUT</option>
              </select>
            </div>
          </div>

          {/* Contracts + Strike */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <Field
              label="Contract #"
              name="contracts"
              type="number"
              defaultValue={1}
              step="1"
              placeholder="1"
              hint="(1cont.=100shares)"
              onChange={(v) => setContracts(Math.max(1, Number(v) || 1))}
            />
            <Field
              label="Strike Price"
              name="strike"
              type="number"
              step="0.01"
              placeholder="200.00"
            />
          </div>

          {/* Executed Price + Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Executed Price"
              name="executedPrice"
              type="number"
              step="0.0001"
              placeholder="3.50"
              required={false}
              hint="(actual fill price)"
              onChange={(v) => setExecutedPrice(v ? Number(v) : null)}
            />
            <Field label="Expiry Date" name="expiry" type="date" />
          </div>

          {/* Stock Price (underlying) */}
          <Field
            label="Stock Price"
            name="stockPrice"
            type="number"
            step="0.01"
            placeholder="185.00"
            required={false}
            hint="(underlying stock price at entry)"
          />

          {/* Transaction Date */}
          <Field
            label="Transaction Date"
            name="transactionDate"
            type="date"
            defaultValue={today}
          />

          {/* Trade Fee — accepts math expression */}
          <div>
            <label className={labelCls}>
              Trade Fee
              <span className="ml-1.5 normal-case text-neutral-600 font-normal">
                (math ok: 0.55+0.03+0.03)
              </span>
            </label>
            <input
              type="text"
              value={feeExpr}
              onChange={(e) => {
                setFeeExpr(e.target.value);
                setFeeParseError(false);
              }}
              placeholder="0.55+0.03+0.03"
              className={`${inputCls} ${feeParseError ? "border-red-500/60 ring-1 ring-red-500/30" : ""}`}
            />
            <div className="mt-1.5 min-h-[18px]">
              {feeParseError ? (
                <span className="text-xs text-red-400">Invalid expression — use numbers with + or −</span>
              ) : parsedFee !== null && feeExpr.trim() !== "" ? (
                <span className="text-xs text-neutral-500">
                  = <span className="text-green-400 font-semibold tabular-nums">${parsedFee.toFixed(4)}</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Total Cost — read-only display */}
          <div>
            <label className={labelCls}>
              Total Cost
              <span className="ml-1.5 normal-case text-neutral-600 font-normal">
                (executed price × contracts × 100 + fee)
              </span>
            </label>
            <div className={`${inputCls} cursor-default`}>
              {totalCost != null ? (
                <span className="text-green-400 font-semibold tabular-nums">${totalCost.toFixed(2)}</span>
              ) : (
                <span className="text-neutral-600">Enter executed price to calculate</span>
              )}
            </div>
          </div>

          {/* Trade Setup */}
          <div>
            <label className={labelCls}>
              Trade Setup
              <span className="ml-1.5 normal-case text-neutral-600 font-normal">(why are you entering this trade?)</span>
            </label>
            <textarea
              name="tradeSetup"
              rows={3}
              placeholder="e.g. Earnings play, IV crush, breakout above resistance…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Optional notes…"
              className={`${inputCls} resize-none`}
            />
          </div>
        </>
      ) : (
        <>
          {/* Exit Price + Exit Date */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Exit Price (per share)"
              name="exitPrice"
              type="number"
              step="0.01"
              placeholder="5.20"
              onChange={(v) => setCloseExitPrice(v ? Number(v) : null)}
            />
            <Field label="Exit Date" name="exitDate" type="date" defaultValue={today} />
          </div>

          {/* Stock Price at Exit */}
          <Field
            label="Stock Price at Exit"
            name="stockPriceAtExit"
            type="number"
            step="0.01"
            placeholder="210.00"
            required={false}
            hint="(underlying stock price when closing)"
          />

          {/* Exit Fee — math expression */}
          <div>
            <label className={labelCls}>
              Exit Fee
              <span className="ml-1.5 normal-case text-neutral-600 font-normal">(math ok: 0.55+0.03)</span>
            </label>
            <input
              type="text"
              value={exitFeeExpr}
              onChange={(e) => {
                setExitFeeExpr(e.target.value);
                setExitFeeParseError(false);
              }}
              placeholder="0.55+0.03"
              className={`${inputCls} ${exitFeeParseError ? "border-red-500/60 ring-1 ring-red-500/30" : ""}`}
            />
            <div className="mt-1.5 min-h-[18px]">
              {exitFeeParseError ? (
                <span className="text-xs text-red-400">Invalid expression — use numbers with + or −</span>
              ) : parsedExitFee !== null && exitFeeExpr.trim() !== "" ? (
                <span className="text-xs text-neutral-500">
                  = <span className="text-green-400 font-semibold tabular-nums">${parsedExitFee.toFixed(4)}</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Estimated Total Credit — read-only */}
          <div>
            <label className={labelCls}>
              Estimated Total Credit
              <span className="ml-1.5 normal-case text-neutral-600 font-normal">
                (exit price × {closeContracts} contract{closeContracts !== 1 ? "s" : ""} × 100 − fee)
              </span>
            </label>
            <div className={`${inputCls} cursor-default`}>
              {estimatedCredit != null ? (
                <span className={`font-semibold tabular-nums ${estimatedCredit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ${estimatedCredit.toFixed(2)}
                </span>
              ) : (
                <span className="text-neutral-600">Enter exit price to calculate</span>
              )}
            </div>
          </div>

          {/* Close Reason */}
          <div>
            <label className={labelCls}>
              Close Trade Reason
              <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span>
            </label>
            <input
              name="closeReason"
              type="text"
              placeholder="e.g. Target reached, stop loss hit, IV expanded…"
              className={inputCls}
            />
          </div>

          {/* Lesson Learnt */}
          <div>
            <label className={labelCls}>
              Lesson Learnt
              <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span>
            </label>
            <textarea
              name="lessonLearnt"
              rows={3}
              placeholder="What did this trade teach you?"
              className={`${inputCls} resize-none`}
            />
          </div>
        </>
      )}

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-6 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
      >
        {loading ? "Saving…" : props.mode === "new" ? "Log Trade" : "Close Trade"}
      </button>
    </form>
  );
}
