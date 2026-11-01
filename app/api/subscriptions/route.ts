import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getDefaultUser();
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      include: {
        strategy: {
          select: {
            id: true,
            name: true,
            symbol: true,
            exchange: true,
            winRate: true,
            roi: true,
          },
        },
        brokerAccount: {
          select: {
            id: true,
            name: true,
            broker: true,
            clientId: true,
            isActive: true,
            isLiveTrading: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, subscriptions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getDefaultUser();
    const body = await request.json();

    const { strategyId, brokerAccountId, multiplier = 1.0, maxLots, maxDailyLoss } = body;

    if (!strategyId || !brokerAccountId) {
      return NextResponse.json(
        { success: false, error: "strategyId and brokerAccountId are required" },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existing = await prisma.subscription.findUnique({
      where: {
        strategyId_brokerAccountId: {
          strategyId,
          brokerAccountId,
        },
      },
    });

    if (existing) {
      const updated = await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          multiplier: Number(multiplier) || 1.0,
          maxLots: maxLots ? Number(maxLots) : null,
          maxDailyLoss: maxDailyLoss ? Number(maxDailyLoss) : null,
        },
      });
      return NextResponse.json({ success: true, subscription: updated, message: "Subscription updated" });
    }

    const created = await prisma.subscription.create({
      data: {
        userId: user.id,
        strategyId,
        brokerAccountId,
        multiplier: Number(multiplier) || 1.0,
        maxLots: maxLots ? Number(maxLots) : null,
        maxDailyLoss: maxDailyLoss ? Number(maxDailyLoss) : null,
      },
    });

    return NextResponse.json({ success: true, subscription: created, message: "Mirror copy active!" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Subscription id required" }, { status: 400 });
    }

    await prisma.subscription.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Subscription cancelled" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
