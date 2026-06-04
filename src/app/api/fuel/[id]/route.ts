import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fuelId = Number(id);
  const body = await req.json();
  const { month, yieldReceived, deployed, reinvestedBack } = body;

  if (!month || yieldReceived == null || deployed == null || reinvestedBack == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const fuel = await prisma.monthlyFuel.update({
      where: { id: fuelId },
      data: {
        month,
        yieldReceived: Number(yieldReceived),
        deployed: Number(deployed),
        reinvestedBack: Number(reinvestedBack),
      },
    });
    return NextResponse.json(fuel);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fuelId = Number(id);

  try {
    await prisma.monthlyFuel.delete({ where: { id: fuelId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
