import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const flows = await prisma.cashFlow.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(flows);
}

export async function POST(req: NextRequest) {
  const { type, amount, date, note } = await req.json();

  if (!type || amount == null || !date) {
    return NextResponse.json(
      { error: "type, amount, and date are required" },
      { status: 400 }
    );
  }
  if (type !== "IN" && type !== "OUT") {
    return NextResponse.json({ error: "type must be IN or OUT" }, { status: 400 });
  }

  const flow = await prisma.cashFlow.create({
    data: {
      type,
      amount: Number(amount),
      date: new Date(date),
      note: note || null,
    },
  });

  return NextResponse.json(flow);
}
