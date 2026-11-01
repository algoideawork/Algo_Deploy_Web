import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
    const status = searchParams.get("status");

    const executions = await prisma.orderExecution.findMany({
      where: {
        ...(status && { status: status as "PENDING" | "SUCCESS" | "REJECTED" | "CANCELLED" }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        strategy: {
          select: { name: true, symbol: true },
        },
        brokerAccount: {
          select: { name: true, broker: true, clientId: true },
        },
      },
    });

    return NextResponse.json({ success: true, executions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
