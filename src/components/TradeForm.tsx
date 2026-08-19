"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Trade } from "@/app/generated/prisma/client";

type TradeKind = "OPTION" | "STOCK";
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
  label, name, type, defaultValue, required = true, step, placeholder, hint, onChange,
}: {
  label: string; name: string; type: string; defaultValue?: string | number;
  required?: boolean; step?: string; placeholder?: string; hint?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {hint && <span className="ml-1.5 normal-case text-neutral-600 font-normal">{hint}</span>}
      </label>
      <input
        name={name} type={type} defaultValue={defaultValue ?? ""} required={required}
        step={step} placeholder={placeholder} className={inputCls}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  );
}

function FeeField({
  label, hint, value, onChange, parseError, parsedValue,
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  parseError: boolean; parsedValue: number | null;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {hint && <span className="ml-1.5 normal-case text-neutral-600 font-normal">{hint}</span>}
      </label>
      <input
        type="text" value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className={`${inputCls} ${parseError ? "border-red-500/60 ring-1 ring-red-500/30" : ""}`}
      />
      <div className="mt-1.5 min-h-[18px]">
        {parseError ? (
          <span className="text-xs text-red-400">Invalid expression — use numbers with + or −</span>
        ) : parsedValue !== null && value.trim() !== "" ? (
          <span className="text-xs text-neutral-500">
            = <span className="text-green-400 font-semibold tabular-nums">${parsedValue.toFixed(4)}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function TradeForm(props: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // For "new" mode: kind selector
  const [kind, setKind] = useState<TradeKind>("OPTION");

  // For "close" mode: derive kind from the trade
  const closeKind: TradeKind =
    props.mode === "close" ? ((props.trade.tradeKind as TradeKind) ?? "OPTION") : "OPTION";

  // ── New-mode reactive state ──
  const [contracts, setContracts] = useState(1);
  const [executedPrice, setExecutedPrice] = useState<number | null>(null);
  const [feeExpr, setFeeExpr] = useState("");
  const [feeParseError, setFeeParseError] = useState(false);
  const [vatExpr, setVatExpr] = useState("");

  const parsedFee = parseFeeExpr(feeExpr);
  const parsedVat = parseFeeExpr(vatExpr);

  const totalCostOption =
    executedPrice != null && parsedFee != null
      ? executedPrice * contracts * 100 + parsedFee
      : null;

  const totalCostStock =
    executedPrice != null && contracts > 0 && parsedFee != null && parsedVat != null
      ? executedPrice * contracts + parsedFee + parsedVat
      : null;

  // ── Close-mode reactive state ──
  const [closeExitPrice, setCloseExitPrice] = useState<number | null>(null);
  const [exitFeeExpr, setExitFeeExpr] = useState("");
  const [exitFeeParseError, setExitFeeParseError] = useState(false);
  const [exitVatExpr, setExitVatExpr] = useState("");

  const parsedExitFee = parseFeeExpr(exitFeeExpr);
  const parsedExitVat = parseFeeExpr(exitVatExpr);
  const closeContracts = props.mode === "close" ? (props.trade.contracts ?? 1) : 1;
  const [soldQty, setSoldQty] = useState<number>(closeContracts);
  // Reset qty and loading when remaining position shrinks after a partial sell + page refresh
  useEffect(() => { setSoldQty(closeContracts); }, [closeContracts]);

  const estimatedCreditOption =
    closeExitPrice != null && parsedExitFee != null
      ? closeExitPrice * soldQty * 100 - parsedExitFee
      : null;

  const estimatedCreditStock =
    closeExitPrice != null && parsedExitFee != null && parsedExitVat != null
      ? closeExitPrice * soldQty - parsedExitFee - parsedExitVat
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (props.mode === "new") {
      const computedFee = parseFeeExpr(feeExpr);
      if (computedFee === null) { setFeeParseError(true); return; }
      setFeeParseError(false);
      setLoading(true);

      const fd = new FormData(e.currentTarget);
      const data = Object.fromEntries(fd) as Record<string, string>;
      data.tradeFee = String(computedFee);
      data.tradeKind = kind;
      if (kind === "STOCK") {
        data.vatAmount = String(parseFeeExpr(vatExpr) ?? 0);
      }
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
      if (computedExitFee === null) { setExitFeeParseError(true); return; }
      setExitFeeParseError(false);
      setLoading(true);

      const fd = new FormData(e.currentTarget);
      const data = Object.fromEntries(fd) as Record<string, string>;
      data.exitFee = String(computedExitFee);
      if (closeKind === "STOCK") {
        data.exitVatAmount = String(parseFeeExpr(exitVatExpr) ?? 0);
      }
      delete data.exitFee_expr;

      const tradeId = (props as { mode: "close"; trade: { id: number } }).trade.id;
      const isPartialSell = soldQty < closeContracts;

      try {
        let res: Response;
        if (isPartialSell) {
          res = await fetch(`/api/trades/${tradeId}/partial-sell`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, contractsToSell: soldQty }),
          });
          if (!res.ok) throw new Error(await readError(res));
          setLoading(false);
          router.push(`/trades/${tradeId}`);
        } else {
          res = await fetch(`/api/trades/${tradeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error(await readError(res));
          router.push("/trades");
        }
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
          {/* Kind selector */}
          <div>
            <label className={labelCls}>Trade Type</label>
            <div className="flex gap-2">
              {(["OPTION", "STOCK"] as TradeKind[]).map((k) => (
                <button
                  key={k} type="button" onClick={() => setKind(k)}
                  className={`px-5 py-2 rounded-md text-sm font-semibold border transition-colors cursor-pointer ${
                    kind === k
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-[#111] border-[#2a2a2a] text-neutral-400 hover:text-white"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {kind === "OPTION" ? (
            <>
              {/* Ticker + Type */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ticker" name="ticker" type="text" placeholder="AAPL" />
                <div>
                  <label className={labelCls}>Type</label>
                  <select name="type" required className={`${inputCls} appearance-none`}>
                    <option value="CALL" style={{ background: "#111" }}>CALL</option>
                    <option value="PUT"  style={{ background: "#111" }}>PUT</option>
                  </select>
                </div>
              </div>

              {/* Contracts + Strike */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <Field
                  label="Contract #" name="contracts" type="number" defaultValue={1}
                  step="1" placeholder="1" hint="(1cont.=100shares)"
                  onChange={(v) => setContracts(Math.max(1, Number(v) || 1))}
                />
                <Field label="Strike Price" name="strike" type="number" step="0.01" placeholder="200.00" />
              </div>

              {/* Executed Price + Expiry */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Executed Price" name="executedPrice" type="number"
                  step="0.0001" placeholder="3.50" required={false} hint="(actual fill price)"
                  onChange={(v) => setExecutedPrice(v ? Number(v) : null)}
                />
                <Field label="Expiry Date" name="expiry" type="date" />
              </div>

              {/* Stock Price (underlying) */}
              <Field
                label="Stock Price" name="stockPrice" type="number"
                step="0.01" placeholder="185.00" required={false}
                hint="(underlying stock price at entry)"
              />

              {/* Transaction Date */}
              <Field label="Transaction Date" name="transactionDate" type="date" defaultValue={today} />

              {/* Trade Fee */}
              <FeeField
                label="Trade Fee" hint="(math ok: 0.55+0.03+0.03)"
                value={feeExpr} onChange={(v) => { setFeeExpr(v); setFeeParseError(false); }}
                parseError={feeParseError} parsedValue={parsedFee}
              />

              {/* Total Cost preview */}
              <div>
                <label className={labelCls}>
                  Total Cost
                  <span className="ml-1.5 normal-case text-neutral-600 font-normal">
                    (executed price × contracts × 100 + fee)
                  </span>
                </label>
                <div className={`${inputCls} cursor-default`}>
                  {totalCostOption != null ? (
                    <span className="text-green-400 font-semibold tabular-nums">${totalCostOption.toFixed(2)}</span>
                  ) : (
                    <span className="text-neutral-600">Enter executed price to calculate</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Ticker + Shares */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock Symbol" name="ticker" type="text" placeholder="AAPL" />
                <Field
                  label="Shares" name="contracts" type="number" defaultValue={1} step="0.0000001" placeholder="100"
                  onChange={(v) => setContracts(Math.max(1, Number(v) || 1))}
                />
              </div>

              {/* Executed Price + Date */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Executed Price (per share)" name="executedPrice" type="number"
                  step="0.0001" placeholder="185.00"
                  onChange={(v) => setExecutedPrice(v ? Number(v) : null)}
                />
                <Field label="Executed Date" name="transactionDate" type="date" defaultValue={today} />
              </div>

              {/* Commission Fee + VAT */}
              <div className="grid grid-cols-2 gap-4">
                <FeeField
                  label="Commission Fee" hint="(math ok: 10+5)"
                  value={feeExpr} onChange={(v) => {
                    setFeeExpr(v);
                    setFeeParseError(false);
                    const f = parseFeeExpr(v);
                    if (f != null) setVatExpr((f * 0.07).toFixed(4));
                  }}
                  parseError={feeParseError} parsedValue={parsedFee}
                />
                <FeeField
                  label="VAT 7%" hint="(auto-filled)"
                  value={vatExpr} onChange={setVatExpr}
                  parseError={false} parsedValue={parsedVat}
                />
              </div>

              {/* Total Buy Amount preview */}
              <div>
                <label className={labelCls}>
                  Total Buy Amount
                  <span className="ml-1.5 normal-case text-neutral-600 font-normal">
                    (price × shares + commission + VAT)
                  </span>
                </label>
                <div className={`${inputCls} cursor-default`}>
                  {totalCostStock != null ? (
                    <span className="text-green-400 font-semibold tabular-nums">${totalCostStock.toFixed(2)}</span>
                  ) : (
                    <span className="text-neutral-600">Enter price and shares to calculate</span>
                  )}
                </div>
              </div>

              {/* Reason to Buy */}
              <div>
                <label className={labelCls}>
                  Reason to Buy
                  <span className="ml-1.5 normal-case text-neutral-600 font-normal">(why are you entering this position?)</span>
                </label>
                <textarea
                  name="tradeSetup" rows={3}
                  placeholder="e.g. Strong earnings, breakout above resistance…"
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>Notes <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
                <textarea name="notes" rows={2} placeholder="Optional notes…" className={`${inputCls} resize-none`} />
              </div>
            </>
          )}

          {kind === "OPTION" && (
            <>
              {/* Trade Setup */}
              <div>
                <label className={labelCls}>
                  Trade Setup
                  <span className="ml-1.5 normal-case text-neutral-600 font-normal">(why are you entering this trade?)</span>
                </label>
                <textarea
                  name="tradeSetup" rows={3}
                  placeholder="e.g. Earnings play, IV crush, breakout above resistance…"
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>Notes <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
                <textarea name="notes" rows={3} placeholder="Optional notes…" className={`${inputCls} resize-none`} />
              </div>
            </>
          )}
        </>
      ) : (
        /* ── Close / Sell mode ── */
        <>
          {closeKind === "STOCK" ? (
            <>
              {/* Shares to sell */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Shares to Sell</label>
                  <input
                    type="number" step="0.0000001" min="0.0000001" max={closeContracts}
                    value={soldQty}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setSoldQty(isNaN(v) || v <= 0 ? closeContracts : Math.min(closeContracts, v));
                    }}
                    className={inputCls}
                  />
                  <p className="text-xs text-neutral-600 mt-1">
                    Max: {parseFloat(closeContracts.toFixed(7)).toString()} sh
                  </p>
                </div>
                <div className="self-center pt-4">
                  {soldQty < closeContracts ? (
                    <span className="text-xs text-amber-400">
                      {parseFloat((closeContracts - soldQty).toFixed(7)).toString()} sh will remain open
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-500">Full position — closes trade</span>
                  )}
                </div>
              </div>

              {/* Sell Price + Sell Date */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Sell Price (per share)" name="exitPrice" type="number"
                  step="0.0001" placeholder="200.00"
                  onChange={(v) => setCloseExitPrice(v ? Number(v) : null)}
                />
                <Field label="Sell Date" name="exitDate" type="date" defaultValue={today} />
              </div>

              {/* Exit Commission + Exit VAT */}
              <div className="grid grid-cols-2 gap-4">
                <FeeField
                  label="Exit Commission"
                  value={exitFeeExpr} onChange={(v) => {
                    setExitFeeExpr(v);
                    setExitFeeParseError(false);
                    const f = parseFeeExpr(v);
                    if (f != null) setExitVatExpr((f * 0.07).toFixed(4));
                  }}
                  parseError={exitFeeParseError} parsedValue={parsedExitFee}
                />
                <FeeField
                  label="Exit VAT 7%" hint="(auto-filled)"
                  value={exitVatExpr} onChange={setExitVatExpr}
                  parseError={false} parsedValue={parsedExitVat}
                />
              </div>

              {/* Estimated Proceeds */}
              <div>
                <label className={labelCls}>
                  Estimated Proceeds
                  <span className="ml-1.5 normal-case text-neutral-600 font-normal">
                    (sell price × {parseFloat(soldQty.toFixed(7)).toString()} sh − commission − VAT)
                  </span>
                </label>
                <div className={`${inputCls} cursor-default`}>
                  {estimatedCreditStock != null ? (
                    <span className={`font-semibold tabular-nums ${estimatedCreditStock >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${estimatedCreditStock.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-neutral-600">Enter sell price to calculate</span>
                  )}
                </div>
              </div>

              {/* Close Reason */}
              <div>
                <label className={labelCls}>Reason to Sell <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
                <input name="closeReason" type="text" placeholder="e.g. Target reached, stop loss hit…" className={inputCls} />
              </div>

              {/* Lesson Learnt */}
              <div>
                <label className={labelCls}>Lesson Learnt <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
                <textarea name="lessonLearnt" rows={3} placeholder="What did this trade teach you?" className={`${inputCls} resize-none`} />
              </div>
            </>
          ) : (
            <>
              {/* Contracts to sell (only shown when position > 1 contract) */}
              {closeContracts > 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Contracts to Sell</label>
                    <input
                      type="number" step="1" min="1" max={closeContracts}
                      value={soldQty}
                      onChange={(e) => {
                        const v = Math.floor(Number(e.target.value));
                        setSoldQty(isNaN(v) || v < 1 ? closeContracts : Math.min(closeContracts, v));
                      }}
                      className={inputCls}
                    />
                    <p className="text-xs text-neutral-600 mt-1">Max: {closeContracts} ct</p>
                  </div>
                  <div className="self-center pt-4">
                    {soldQty < closeContracts ? (
                      <span className="text-xs text-amber-400">
                        {closeContracts - soldQty} contract{closeContracts - soldQty !== 1 ? "s" : ""} will remain open
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-500">Full position — closes trade</span>
                    )}
                  </div>
                </div>
              )}

              {/* Option close — existing fields */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Exit Price (per share)" name="exitPrice" type="number"
                  step="0.01" placeholder="5.20"
                  onChange={(v) => setCloseExitPrice(v ? Number(v) : null)}
                />
                <Field label="Exit Date" name="exitDate" type="date" defaultValue={today} />
              </div>

              <Field
                label="Stock Price at Exit" name="stockPriceAtExit" type="number"
                step="0.01" placeholder="210.00" required={false}
                hint="(underlying stock price when closing)"
              />

              <FeeField
                label="Exit Fee" hint="(math ok: 0.55+0.03)"
                value={exitFeeExpr} onChange={(v) => { setExitFeeExpr(v); setExitFeeParseError(false); }}
                parseError={exitFeeParseError} parsedValue={parsedExitFee}
              />

              {/* Estimated Credit */}
              <div>
                <label className={labelCls}>
                  Estimated Total Credit
                  <span className="ml-1.5 normal-case text-neutral-600 font-normal">
                    (exit price × {soldQty} contract{soldQty !== 1 ? "s" : ""} × 100 − fee)
                  </span>
                </label>
                <div className={`${inputCls} cursor-default`}>
                  {estimatedCreditOption != null ? (
                    <span className={`font-semibold tabular-nums ${estimatedCreditOption >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${estimatedCreditOption.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-neutral-600">Enter exit price to calculate</span>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Close Trade Reason <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
                <input name="closeReason" type="text" placeholder="e.g. Target reached, stop loss hit, IV expanded…" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Lesson Learnt <span className="ml-1.5 normal-case text-neutral-600 font-normal">(optional)</span></label>
                <textarea name="lessonLearnt" rows={3} placeholder="What did this trade teach you?" className={`${inputCls} resize-none`} />
              </div>
            </>
          )}
        </>
      )}

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit" disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-6 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
      >
        {loading
          ? "Saving…"
          : props.mode === "new"
            ? "Log Trade"
            : soldQty < closeContracts
              ? "Partial Sell"
              : closeKind === "STOCK"
                ? "Record Sale"
                : "Close Trade"}
      </button>
    </form>
  );
}
