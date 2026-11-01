import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultUser } from "@/lib/user";
import { encryptData } from "@/lib/encryption";
import { BrokerType } from "@/lib/brokers/types";
import { createBrokerAdapter } from "@/lib/brokers/factory";

export async function GET() {
  try {
    const user = await getDefaultUser();
    const accounts = await prisma.brokerAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        broker: true,
        clientId: true,
        isActive: true,
        isLiveTrading: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        errorMessage: true,
        createdAt: true,
        _count: {
          select: {
            subscriptions: true,
            executions: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch accounts" },
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
      broker,
      clientId,
      apiKey,
      apiSecret,
      pin,
      totpSecret,
      accessToken,
      isLiveTrading = true,
    } = body;

    if (!name || !broker || !clientId || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Name, Broker, Client ID, and API Key are required." },
        { status: 400 }
      );
    }

    if (!["DHAN", "ZERODHA", "ANGEL_ONE"].includes(broker)) {
      return NextResponse.json({ success: false, error: "Invalid broker selected." }, { status: 400 });
    }

    // Encrypt sensitive secrets using AES-256
    const encryptedApiKey = encryptData(apiKey);
    const encryptedApiSecret = apiSecret ? encryptData(apiSecret) : null;
    const encryptedPin = pin ? encryptData(pin) : null;
    const encryptedTotpSecret = totpSecret ? encryptData(totpSecret) : null;
    const encryptedAccessToken = accessToken ? encryptData(accessToken) : null;

    // Test initial authentication
    let initialSyncStatus = "PENDING";
    let initialErrorMessage: string | null = null;
    let finalAccessToken = encryptedAccessToken;

    try {
      const tempRecord = {
        broker: broker as BrokerType,
        clientId,
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        pin: encryptedPin,
        totpSecret: encryptedTotpSecret,
        accessToken: encryptedAccessToken,
      };
      const adapter = createBrokerAdapter(tempRecord);
      const authResult = await adapter.authenticate();

      if (authResult.success) {
        initialSyncStatus = "SUCCESS";
        if (authResult.accessToken) {
          finalAccessToken = encryptData(authResult.accessToken);
        }
      } else {
        initialSyncStatus = "FAILED";
        initialErrorMessage = authResult.message || "Failed initial connection check";
      }
    } catch (err: unknown) {
      initialSyncStatus = "FAILED";
      initialErrorMessage = err instanceof Error ? err.message : "Authentication error";
    }

    const account = await prisma.brokerAccount.create({
      data: {
        userId: user.id,
        name,
        broker: broker as BrokerType,
        clientId,
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        pin: encryptedPin,
        totpSecret: encryptedTotpSecret,
        accessToken: finalAccessToken,
        isLiveTrading: Boolean(isLiveTrading),
        lastSyncAt: new Date(),
        lastSyncStatus: initialSyncStatus,
        errorMessage: initialErrorMessage,
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        name: account.name,
        broker: account.broker,
        clientId: account.clientId,
        lastSyncStatus: account.lastSyncStatus,
        errorMessage: account.errorMessage,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to add broker account" },
      { status: 500 }
    );
  }
}
