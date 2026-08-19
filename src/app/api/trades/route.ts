import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const trades = await prisma.trade.findMany({ orderBy: { entryDate: "desc" } });
  return NextResponse.json(trades);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    tradeKind,
    ticker, type, strike, expiry,
    transactionDate, entryDate,
    contracts, executedPrice, tradeFee, vatAmount,
    tradeSetup, notes, stockPrice,
  } = body;

  const kind = tradeKind ?? "OPTION";

  if (!ticker || executedPrice == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (kind === "OPTION" && (!type || strike == null || !expiry)) {
    return NextResponse.json({ error: "Missing required option fields" }, { status: 400 });
  }

  const dateStr = transactionDate || entryDate;
  if (!dateStr) {
    return NextResponse.json({ error: "Transaction date is required" }, { status: 400 });
  }

  try {
    const trade = await prisma.trade.create({
      data: {
        tradeKind: kind,
        ticker,
        type: kind === "OPTION" ? type : "BUY",
        strike: strike != null ? Number(strike) : null,
        expiry: expiry ? new Date(expiry) : null,
        premiumPaid: Number(executedPrice),
        entryDate: new Date(dateStr),
        contracts: contracts != null ? Number(contracts) : 1,
        executedPrice: Number(executedPrice),
        tradeFee: tradeFee != null ? Number(tradeFee) : null,
        vatAmount: vatAmount != null ? Number(vatAmount) : null,
        tradeSetup: tradeSetup ?? null,
        notes: notes ?? null,
        stockPrice: stockPrice != null ? Number(stockPrice) : null,
      },
    });
    return NextResponse.json(trade, { status: 201 });
  } catch (err) {
    console.error("[POST /api/trades]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create trade" },
      { status: 500 }
    );
  }
}
