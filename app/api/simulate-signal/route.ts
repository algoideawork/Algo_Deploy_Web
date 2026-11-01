import { NextRequest, NextResponse } from "next/server";
import { processWebhookSignal } from "@/lib/engine/executor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookToken, action, symbol, quantity = 1, productType = "MIS", orderType = "MARKET", price } = body;

    if (!webhookToken || !action || !symbol) {
      return NextResponse.json(
        { success: false, error: "webhookToken, action, and symbol are required" },
        { status: 400 }
      );
    }

    const result = await processWebhookSignal(webhookToken, {
      action,
      symbol: symbol.toUpperCase(),
      quantity: Number(quantity) || 1,
      productType,
      orderType,
      price: price ? Number(price) : undefined,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}
