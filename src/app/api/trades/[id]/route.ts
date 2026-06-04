import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tradeId = Number(id);
  const body = await req.json();

  const {
    ticker, type, contracts, strike, executedPrice,
    transactionDate, tradeFee, tradeSetup, notes,
    exitPrice, exitDate, exitFee, closeReason, lessonLearnt,
  } = body;

  const existing = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!existing) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

  try {
    const execP = executedPrice != null ? Number(executedPrice) : existing.premiumPaid;
    const numContracts = contracts != null ? Number(contracts) : (existing.contracts ?? 1);

    // Recalculate P&L if trade is closed and exit fields provided
    let pnl = existing.pnl;
    let returnPct = existing.returnPct;
    let holdDays = existing.holdDays;
    let reinvestSuggestion = existing.reinvestSuggestion;

    if (existing.status === "CLOSED" && exitPrice != null && exitDate) {
      const exitP = Number(exitPrice);
      const exitD = new Date(exitDate);
      const exitF = exitFee != null ? Number(exitFee) : 0;
      const fee = tradeFee != null ? Number(tradeFee) : (existing.tradeFee ?? 0);
      pnl = (exitP - execP) * numContracts * 100 - exitF - fee;
      returnPct = (pnl / (execP * numContracts * 100)) * 100;
      holdDays = Math.round(
        (exitD.getTime() - new Date(transactionDate ?? existing.entryDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      reinvestSuggestion = pnl > 0 ? pnl * 0.1 : null;
    }

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        ticker: ticker ?? existing.ticker,
        type: type ?? existing.type,
        contracts: numContracts,
        strike: strike != null ? Number(strike) : existing.strike,
        premiumPaid: execP,
        executedPrice: execP,
        entryDate: transactionDate ? new Date(transactionDate) : existing.entryDate,
        tradeFee: tradeFee != null ? Number(tradeFee) : existing.tradeFee,
        tradeSetup: tradeSetup !== undefined ? (tradeSetup || null) : existing.tradeSetup,
        notes: notes !== undefined ? (notes || null) : existing.notes,
        ...(existing.status === "CLOSED" && exitPrice != null && exitDate
          ? {
              exitPrice: Number(exitPrice),
              exitDate: new Date(exitDate),
              exitFee: exitFee != null ? Number(exitFee) : existing.exitFee,
              closeReason: closeReason !== undefined ? (closeReason || null) : existing.closeReason,
              lessonLearnt: lessonLearnt !== undefined ? (lessonLearnt || null) : existing.lessonLearnt,
              pnl,
              returnPct,
              holdDays,
              reinvestSuggestion,
            }
          : {}),
      },
    });

    return NextResponse.json(trade);
  } catch (err) {
    console.error("[PUT /api/trades]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update trade" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tradeId = Number(id);
  const existing = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!existing) return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  await prisma.trade.delete({ where: { id: tradeId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tradeId = Number(id);
  const body = await req.json();
  const { exitPrice, exitDate, exitFee, closeReason, lessonLearnt } = body;

  if (exitPrice == null || !exitDate) {
    return NextResponse.json({ error: "exitPrice and exitDate are required" }, { status: 400 });
  }

  const existing = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!existing) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  try {
    const exitP = Number(exitPrice);
    const exitD = new Date(exitDate);
    const exitF = exitFee != null ? Number(exitFee) : 0;
    const numContracts = existing.contracts ?? 1;

    const pnl =
      (exitP - existing.premiumPaid) * numContracts * 100
      - exitF
      - (existing.tradeFee ?? 0);
    const returnPct = (pnl / (existing.premiumPaid * numContracts * 100)) * 100;
    const holdDays = Math.round(
      (exitD.getTime() - existing.entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const reinvestSuggestion = pnl > 0 ? pnl * 0.1 : null;

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        exitPrice: exitP,
        exitDate: exitD,
        status: "CLOSED",
        pnl,
        returnPct,
        holdDays,
        reinvestSuggestion,
        exitFee: exitF > 0 ? exitF : null,
        closeReason: closeReason ?? null,
        lessonLearnt: lessonLearnt ?? null,
      },
    });

    return NextResponse.json(trade);
  } catch (err) {
    console.error("[PATCH /api/trades]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to close trade" },
      { status: 500 }
    );
  }
}
