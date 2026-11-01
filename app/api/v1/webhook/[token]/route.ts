import { NextRequest, NextResponse } from "next/server";
import { processWebhookSignal } from "@/lib/engine/executor";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const strategy = await prisma.strategy.findUnique({
      where: { webhookToken: token },
      select: {
        id: true,
        name: true,
        symbol: true,
        exchange: true,
        isLive: true,
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!strategy) {
      return NextResponse.json({ error: "Invalid webhook token" }, { status: 404 });
    }

    return NextResponse.json({
      status: "ONLINE",
      strategy: strategy.name,
      symbol: strategy.symbol,
      exchange: strategy.exchange,
      isLive: strategy.isLive,
      activeFollowers: strategy._count.subscriptions,
      message: "Webhook endpoint is ready to receive TradingView signals.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const startTime = Date.now();
  try {
    const { token } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid payload: Request body must be a valid JSON object" },
        { status: 400 }
      );
    }

    // Required fields check: action and symbol
    const action = String(body.action || "").toUpperCase();
    const symbol = String(body.symbol || "").toUpperCase();

    if (!action || !["BUY", "SELL", "SQUAREOFF"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid or missing 'action'. Must be 'BUY', 'SELL', or 'SQUAREOFF'" },
        { status: 400 }
      );
    }

    if (!symbol) {
      return NextResponse.json(
        { error: "Missing required 'symbol' field (e.g., 'RELIANCE', 'NIFTY')" },
        { status: 400 }
      );
    }

    // Execute order across all accounts mirrored to this strategy
    const result = await processWebhookSignal(token, {
      action: action as "BUY" | "SELL" | "SQUAREOFF",
      symbol,
      exchangeSegment: body.exchangeSegment,
      quantity: body.quantity ? Number(body.quantity) : undefined,
      productType: body.productType,
      orderType: body.orderType,
      price: body.price ? Number(body.price) : undefined,
      triggerPrice: body.triggerPrice ? Number(body.triggerPrice) : undefined,
      securityId: body.securityId ? String(body.securityId) : undefined,
      tag: body.tag ? String(body.tag) : undefined,
    });

    const executionLatencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      executionLatencyMs,
      summary: result,
    });
  } catch (error) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal execution error",
        executionLatencyMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

