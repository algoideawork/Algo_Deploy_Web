import { prisma } from "../prisma";
import { createBrokerAdapter } from "../brokers/factory";
import { ExchangeSegment, OrderAction, OrderRequest, OrderType, ProductType } from "../brokers/types";

export interface IncomingSignalPayload {
  action: "BUY" | "SELL" | "SQUAREOFF";
  symbol: string;
  exchangeSegment?: ExchangeSegment;
  quantity?: number;
  productType?: ProductType;
  orderType?: OrderType;
  price?: number;
  triggerPrice?: number;
  securityId?: string;
  tag?: string;
}

export interface ExecutionResultSummary {
  signalLogId: string;
  strategyId: string;
  totalSubscribers: number;
  successCount: number;
  failedCount: number;
  executions: Array<{
    brokerAccountId: string;
    brokerName: string;
    broker: string;
    quantity: number;
    status: "SUCCESS" | "REJECTED" | "SIMULATED";
    brokerOrderId?: string;
    rejectionReason?: string;
    latencyMs: number;
  }>;
}

export async function processWebhookSignal(
  webhookToken: string,
  payload: IncomingSignalPayload
): Promise<ExecutionResultSummary> {
  const startTime = Date.now();

  // 1. Find Strategy
  const strategy = await prisma.strategy.findUnique({
    where: { webhookToken },
    include: {
      subscriptions: {
        where: { isActive: true },
        include: {
          brokerAccount: true,
        },
      },
    },
  });

  if (!strategy) {
    throw new Error(`Strategy not found for token: ${webhookToken}`);
  }

  if (!strategy.isLive) {
    throw new Error(`Strategy "${strategy.name}" is currently paused / inactive.`);
  }

  // 2. Normalize Signal Fields
  const baseQty = Number(payload.quantity) || 1;
  const action: OrderAction = payload.action === "SELL" ? "SELL" : "BUY";
  const productType: ProductType = payload.productType || "MIS";
  const orderType: OrderType = payload.orderType || "MARKET";
  const exchangeSegment: ExchangeSegment = payload.exchangeSegment || "NSE_EQ";

  // 3. Create SignalLog in DB
  const signalLog = await prisma.signalLog.create({
    data: {
      strategyId: strategy.id,
      rawPayload: payload as unknown as object,
      action: payload.action,
      symbol: payload.symbol,
      orderType,
      price: payload.price ? Number(payload.price) : null,
      totalAccounts: strategy.subscriptions.length,
      status: "PROCESSED",
    },
  });

  const activeSubscriptions = strategy.subscriptions.filter(
    (sub) => sub.brokerAccount && sub.brokerAccount.isActive
  );

  let successCount = 0;
  let failedCount = 0;

  // 4. Dispatch Orders in Parallel across all Accounts
  const executionPromises = activeSubscriptions.map(async (sub) => {
    const execStartTime = Date.now();
    const account = sub.brokerAccount;

    // Calculate proportional sizing
    let calculatedQty = Math.round(baseQty * (sub.multiplier || 1.0));
    if (sub.maxLots && calculatedQty > sub.maxLots) {
      calculatedQty = sub.maxLots;
    }
    if (calculatedQty <= 0) calculatedQty = 1;

    // Check for Paper Trading / Live Trading mode
    if (!account.isLiveTrading) {
      const latencyMs = Date.now() - execStartTime;
      const simOrderId = `SIM_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      await prisma.orderExecution.create({
        data: {
          signalLogId: signalLog.id,
          strategyId: strategy.id,
          brokerAccountId: account.id,
          broker: account.broker,
          symbol: payload.symbol,
          transactionType: action,
          productType,
          orderType,
          quantity: calculatedQty,
          price: payload.price || 0,
          status: "SUCCESS",
          brokerOrderId: simOrderId,
          latencyMs,
          executedAt: new Date(),
        },
      });

      return {
        brokerAccountId: account.id,
        brokerName: account.name,
        broker: account.broker,
        quantity: calculatedQty,
        status: "SIMULATED" as const,
        brokerOrderId: simOrderId,
        latencyMs,
      };
    }

    // Live Execution via Broker Adapter
    try {
      const adapter = createBrokerAdapter(account);

      const orderReq: OrderRequest = {
        symbol: payload.symbol,
        exchangeSegment,
        action,
        productType,
        orderType,
        quantity: calculatedQty,
        price: payload.price,
        triggerPrice: payload.triggerPrice,
        securityId: payload.securityId,
        tag: `ALG_${strategy.id.slice(-6)}`,
      };

      const result = await adapter.placeOrder(orderReq);
      const latencyMs = Date.now() - execStartTime;

      const execStatus: "SUCCESS" | "REJECTED" = result.success ? "SUCCESS" : "REJECTED";

      await prisma.orderExecution.create({
        data: {
          signalLogId: signalLog.id,
          strategyId: strategy.id,
          brokerAccountId: account.id,
          broker: account.broker,
          symbol: payload.symbol,
          transactionType: action,
          productType,
          orderType,
          quantity: calculatedQty,
          price: payload.price || null,
          status: execStatus,
          brokerOrderId: result.brokerOrderId || null,
          rejectionReason: result.success ? null : result.message,
          latencyMs,
          executedAt: new Date(),
        },
      });

      return {
        brokerAccountId: account.id,
        brokerName: account.name,
        broker: account.broker,
        quantity: calculatedQty,
        status: execStatus,
        brokerOrderId: result.brokerOrderId,
        rejectionReason: result.message,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - execStartTime;
      const errorMsg = err instanceof Error ? err.message : "Execution failed";

      await prisma.orderExecution.create({
        data: {
          signalLogId: signalLog.id,
          strategyId: strategy.id,
          brokerAccountId: account.id,
          broker: account.broker,
          symbol: payload.symbol,
          transactionType: action,
          productType,
          orderType,
          quantity: calculatedQty,
          price: payload.price || null,
          status: "REJECTED",
          rejectionReason: errorMsg,
          latencyMs,
          executedAt: new Date(),
        },
      });

      return {
        brokerAccountId: account.id,
        brokerName: account.name,
        broker: account.broker,
        quantity: calculatedQty,
        status: "REJECTED" as const,
        rejectionReason: errorMsg,
        latencyMs,
      };
    }
  });

  const settledResults = await Promise.allSettled(executionPromises);

  const executions = settledResults.map((item, idx) => {
    if (item.status === "fulfilled") {
      if (item.value.status === "SUCCESS" || item.value.status === "SIMULATED") {
        successCount++;
      } else {
        failedCount++;
      }
      return item.value;
    } else {
      failedCount++;
      const account = activeSubscriptions[idx].brokerAccount;
      return {
        brokerAccountId: account.id,
        brokerName: account.name,
        broker: account.broker,
        quantity: 0,
        status: "REJECTED" as const,
        rejectionReason: item.reason?.message || "Internal failure",
        latencyMs: Date.now() - startTime,
      };
    }
  });

  // 5. Update SignalLog with aggregate counts
  await prisma.signalLog.update({
    where: { id: signalLog.id },
    data: {
      successCount,
      failedCount,
      status: failedCount === 0 ? "PROCESSED" : successCount > 0 ? "PARTIAL" : "FAILED",
    },
  });

  return {
    signalLogId: signalLog.id,
    strategyId: strategy.id,
    totalSubscribers: activeSubscriptions.length,
    successCount,
    failedCount,
    executions,
  };
}
