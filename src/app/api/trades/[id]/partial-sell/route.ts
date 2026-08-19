import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calcChildPnl(
  kind: string,
  exitP: number, execP: number, qty: number,
  exitFee: number, exitVat: number
): number {
  if (kind === "STOCK") {
    return (exitP - execP) * qty - exitFee - exitVat;
  }
  return (exitP - execP) * qty * 100 - exitFee;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tradeId = Number(id);
  const body = await req.json();

  const { contractsToSell, exitPrice, exitDate, exitFee, exitVatAmount, closeReason, lessonLearnt } = body;

  if (contractsToSell == null || exitPrice == null || !exitDate) {
    return NextResponse.json(
      { error: "contractsToSell, exitPrice, and exitDate are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!existing) return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  if (existing.status !== "OPEN") {
    return NextResponse.json({ error: "Trade is not open" }, { status: 400 });
  }

  const kind = existing.tradeKind ?? "OPTION";
  const toSell = Number(contractsToSell);
  const remaining = existing.contracts ?? 1;

  if (isNaN(toSell) || toSell <= 0) {
    return NextResponse.json({ error: "contractsToSell must be positive" }, { status: 400 });
  }
  if (toSell >= remaining) {
    return NextResponse.json(
      { error: "Use the standard close form to close the full position" },
      { status: 400 }
    );
  }
  if (kind === "OPTION") {
    if (!Number.isInteger(toSell)) {
      return NextResponse.json({ error: "Option contracts must be whole numbers" }, { status: 400 });
    }
    if (remaining <= 1) {
      return NextResponse.json(
        { error: "Cannot partially close a 1-contract option position" },
        { status: 400 }
      );
    }
  }

  try {
    const exitP = Number(exitPrice);
    const exitD = new Date(exitDate);
    const exitF = exitFee != null ? Number(exitFee) : 0;
    const exitV = exitVatAmount != null ? Number(exitVatAmount) : 0;
    const execP = existing.executedPrice ?? existing.premiumPaid;

    const pnl = calcChildPnl(kind, exitP, execP, toSell, exitF, exitV);
    const returnPct = kind === "OPTION"
      ? (pnl / (execP * toSell * 100)) * 100
      : (pnl / (execP * toSell)) * 100;
    const holdDays = Math.round(
      (exitD.getTime() - existing.entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    await prisma.$transaction([
      prisma.trade.create({
        data: {
          ticker: existing.ticker,
          tradeKind: existing.tradeKind,
          type: existing.type,
          contracts: toSell,
          executedPrice: execP,
          premiumPaid: execP,
          entryDate: existing.entryDate,
          strike: existing.strike,
          expiry: existing.expiry,
          tradeSetup: existing.tradeSetup,
          notes: existing.notes,
          tradeFee: 0,
          vatAmount: 0,
          status: "CLOSED",
          parentTradeId: tradeId,
          exitPrice: exitP,
          exitDate: exitD,
          exitFee: exitF > 0 ? exitF : null,
          exitVatAmount: exitV > 0 ? exitV : null,
          closeReason: closeReason ?? null,
          lessonLearnt: lessonLearnt ?? null,
          pnl,
          returnPct,
          holdDays,
          reinvestSuggestion: pnl > 0 ? pnl * 0.1 : null,
        },
      }),
      prisma.trade.update({
        where: { id: tradeId },
        data: { contracts: remaining - toSell },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/trades/partial-sell]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to partially sell" },
      { status: 500 }
    );
  }
}
