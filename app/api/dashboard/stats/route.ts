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
    const isConnError = error instanceof Error && error.message.includes("Can't reach database server");
    return NextResponse.json({
      success: true,
      stats: {
        totalAccounts: 0,
        activeStrategies: 0,
        totalOrders: 0,
        successRate: 100,
        recentExecutions: [],
      },
      warning: isConnError
        ? "PostgreSQL database not connected. Please set your cloud PostgreSQL DATABASE_URL in .env"
        : undefined,
    });
  }
}

