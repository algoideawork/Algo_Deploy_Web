import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const strategies = await prisma.strategy.findMany({
      where: { isPublic: true },
      orderBy: { roi: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { subscriptions: true, executions: true } },
      },
    });

    return NextResponse.json({ success: true, strategies });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch marketplace" },
      { status: 500 }
    );
  }
}
