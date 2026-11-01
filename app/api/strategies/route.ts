import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getDefaultUser();
    const strategies = await prisma.strategy.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            subscriptions: true,
            signals: true,
            executions: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, strategies });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch strategies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getDefaultUser();
    const body = await request.json();

    const {
      name,
      description,
      symbol = "NIFTY",
      exchange = "NSE",
      isPublic = false,
      riskMultiplierDefault = 1.0,
      tags = [],
    } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Strategy name is required" }, { status: 400 });
    }

    // Generate unique cryptographically secure webhook token
    const webhookToken = crypto.randomBytes(16).toString("hex");

    const strategy = await prisma.strategy.create({
      data: {
        userId: user.id,
        name,
        description,
        symbol: symbol.toUpperCase(),
        exchange: exchange.toUpperCase(),
        webhookToken,
        isPublic: Boolean(isPublic),
        riskMultiplierDefault: Number(riskMultiplierDefault) || 1.0,
        tags: Array.isArray(tags) ? tags : [],
      },
    });

    return NextResponse.json({ success: true, strategy });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create strategy" },
      { status: 500 }
    );
  }
}
