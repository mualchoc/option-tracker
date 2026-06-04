import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const fuel = await prisma.monthlyFuel.findMany({ orderBy: { month: "desc" } });
  return NextResponse.json(fuel);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { month, yieldReceived, deployed, reinvestedBack } = body;

  if (!month || yieldReceived == null || deployed == null || reinvestedBack == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const fuel = await prisma.monthlyFuel.create({
    data: {
      month,
      yieldReceived: Number(yieldReceived),
      deployed: Number(deployed),
      reinvestedBack: Number(reinvestedBack),
    },
  });

  return NextResponse.json(fuel, { status: 201 });
}
