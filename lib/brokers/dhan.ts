import {
  BrokerCredentials,
  FundsInfo,
  IBrokerAdapter,
  OrderRequest,
  OrderResponse,
  Position,
} from "./types";

export class DhanAdapter implements IBrokerAdapter {
  private credentials: BrokerCredentials;
  private baseUrl = "https://api.dhan.co/v2";

  constructor(credentials: BrokerCredentials) {
    this.credentials = credentials;
  }

  private getHeaders(): Record<string, string> {
    return {
      "access-token": this.credentials.accessToken || this.credentials.apiKey,
      "client-id": this.credentials.clientId,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async authenticate(): Promise<{ success: boolean; accessToken?: string; message?: string }> {
    try {
      // Validate credentials by fetching fund limit
      const res = await fetch(`${this.baseUrl}/fundlimit`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.errorMessage || `Authentication failed with status ${res.status}`,
        };
      }

      return {
        success: true,
        accessToken: this.credentials.accessToken || this.credentials.apiKey,
        message: "Dhan connection verified successfully",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error connecting to Dhan";
      return { success: false, message: msg };
    }
  }

  async getFunds(): Promise<FundsInfo> {
    try {
      const res = await fetch(`${this.baseUrl}/fundlimit`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch funds: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        availableCash: Number(data.availabelBalance || data.availableCash || 0),
        usedMargin: Number(data.utilizedAmount || 0),
        totalBalance: Number(data.sodLimit || data.availabelBalance || 0),
      };
    } catch (err) {
      console.error("[DhanAdapter] getFunds error:", err);
      return { availableCash: 0, usedMargin: 0, totalBalance: 0 };
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const res = await fetch(`${this.baseUrl}/positions`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!res.ok) return [];

      const list = await res.json();
      if (!Array.isArray(list)) return [];

      return list.map((item: Record<string, unknown>) => ({
        tradingSymbol: String(item.tradingSymbol || item.customSymbol || ""),
        exchange: String(item.exchangeSegment || "NSE_EQ"),
        productType: String(item.productType || "INTRADAY"),
        netQuantity: Number(item.netQty || 0),
        buyAvgPrice: Number(item.buyAvg || 0),
        sellAvgPrice: Number(item.sellAvg || 0),
        unrealizedPnL: Number(item.unrealizedProfit || 0),
        realizedPnL: Number(item.realizedProfit || 0),
      }));
    } catch (err) {
      console.error("[DhanAdapter] getPositions error:", err);
      return [];
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    try {
      // Map platform product types to Dhan product types
      const dhanProductType =
        order.productType === "CNC" ? "CNC" : order.productType === "NRML" ? "MARGIN" : "INTRADAY";

      // Map platform order types to Dhan order types
      const dhanOrderType =
        order.orderType === "LIMIT"
          ? "LIMIT"
          : order.orderType === "SL"
          ? "STOP_LOSS"
          : order.orderType === "SL_M"
          ? "STOP_LOSS_MARKET"
          : "MARKET";

      const correlationId = `ALG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const payload = {
        dhanClientId: this.credentials.clientId,
        correlationId,
        transactionType: order.action,
        exchangeSegment: order.exchangeSegment || "NSE_EQ",
        productType: dhanProductType,
        orderType: dhanOrderType,
        validity: "DAY",
        tradingSymbol: order.symbol,
        securityId: order.securityId || "1333", // Standard or fallback identifier
        quantity: order.quantity,
        price: order.orderType === "LIMIT" ? order.price || 0 : 0,
        triggerPrice: order.triggerPrice || 0,
      };

      const res = await fetch(`${this.baseUrl}/orders`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.status === "FAILURE" || data.status === "REJECTED") {
        return {
          success: false,
          status: "REJECTED",
          message: data.remarks || data.errorMessage || "Dhan order placement failed",
          rawResponse: data,
        };
      }

      return {
        success: true,
        status: "SUCCESS",
        brokerOrderId: data.orderId || data.data?.orderId,
        message: "Order placed successfully on Dhan",
        rawResponse: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error placing order on Dhan";
      return {
        success: false,
        status: "REJECTED",
        message: msg,
      };
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
      const data = await res.json();
      return {
        success: res.ok,
        message: data.message || (res.ok ? "Order cancelled" : "Failed to cancel order"),
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error cancelling" };
    }
  }
}
