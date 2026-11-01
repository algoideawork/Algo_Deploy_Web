import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBrokerAdapter } from "@/lib/brokers/factory";
import { encryptData } from "@/lib/encryption";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await prisma.brokerAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ success: false, error: "Broker account not found" }, { status: 404 });
    }

    const adapter = createBrokerAdapter(account);

    // 1. Authenticate / Verify connection
    const authResult = await adapter.authenticate();

    let funds = { availableCash: 0, usedMargin: 0, totalBalance: 0 };
    let positionsCount = 0;

    if (authResult.success) {
      try {
        funds = await adapter.getFunds();
        const positions = await adapter.getPositions();
        positionsCount = positions.length;
      } catch (e) {
        console.warn("Could not retrieve funds/positions after auth:", e);
      }

      await prisma.brokerAccount.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "SUCCESS",
          errorMessage: null,
          ...(authResult.accessToken && { accessToken: encryptData(authResult.accessToken) }),
        },
      });

      return NextResponse.json({
        success: true,
        message: authResult.message || "Broker synchronized successfully",
        funds,
        positionsCount,
      });
    } else {
      await prisma.brokerAccount.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "FAILED",
          errorMessage: authResult.message || "Authentication failed",
        },
      });

      return NextResponse.json({
        success: false,
        error: authResult.message || "Failed to authenticate broker connection",
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync error" },
      { status: 500 }
    );
  }
}

