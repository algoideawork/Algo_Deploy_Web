import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalAccounts,
      activeStrategies,
      totalOrders,
      successfulOrders,
      recentExecutions,
    ] = await Promise.all([
      prisma.brokerAccount.count(),
      prisma.strategy.count({ where: { isLive: true } }),
      prisma.orderExecution.count(),
      prisma.orderExecution.count({ where: { status: "SUCCESS" } }),
      prisma.orderExecution.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          strategy: { select: { name: true } },
          brokerAccount: { select: { name: true, broker: true } },
        },
      }),
    ]);

    const successRate = totalOrders > 0 ? Math.round((successfulOrders / totalOrders) * 100) : 100;

    return NextResponse.json({
      success: true,
      stats: {
        totalAccounts,
        activeStrategies,
        totalOrders,
        successRate,
        recentExecutions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
