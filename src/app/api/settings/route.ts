import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.portfolioConfig.findFirst();
  return NextResponse.json(config ?? null);
}

export async function PUT(req: NextRequest) {
  const { startCapital, startDate } = await req.json();

  if (startCapital == null || !startDate) {
    return NextResponse.json(
      { error: "startCapital and startDate are required" },
      { status: 400 }
    );
  }

  const config = await prisma.portfolioConfig.upsert({
    where: { id: 1 },
    update: {
      startCapital: Number(startCapital),
      startDate: new Date(startDate),
    },
    create: {
      id: 1,
      startCapital: Number(startCapital),
      startDate: new Date(startDate),
    },
  });

  return NextResponse.json(config);
}
