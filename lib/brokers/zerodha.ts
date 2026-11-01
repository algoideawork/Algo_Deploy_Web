import {
  BrokerCredentials,
  FundsInfo,
  IBrokerAdapter,
  OrderRequest,
  OrderResponse,
  Position,
} from "./types";

export class ZerodhaAdapter implements IBrokerAdapter {
  private credentials: BrokerCredentials;
  private baseUrl = "https://api.kite.trade";

  constructor(credentials: BrokerCredentials) {
    this.credentials = credentials;
  }

  private getHeaders(): Record<string, string> {
    const token = `${this.credentials.apiKey}:${this.credentials.accessToken}`;
    return {
      Authorization: `token ${token}`,
      "X-Kite-Version": "3",
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };
  }

  async authenticate(): Promise<{ success: boolean; accessToken?: string; message?: string }> {
    try {
      if (!this.credentials.accessToken) {
        return {
          success: false,
          message: "Zerodha requires daily login. Please generate your session access token via Kite login.",
        };
      }

      const res = await fetch(`${this.baseUrl}/user/profile`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        return {
          success: false,
          message: data.message || "Invalid or expired Zerodha session. Please re-login.",
        };
      }

      return {
        success: true,
        accessToken: this.credentials.accessToken,
        message: `Connected to Zerodha Kite (${data.data?.user_name || this.credentials.clientId})`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Error connecting to Zerodha",
      };
    }
  }

  async getFunds(): Promise<FundsInfo> {
    try {
      const res = await fetch(`${this.baseUrl}/user/margins/equity`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        return { availableCash: 0, usedMargin: 0, totalBalance: 0 };
      }

      const equity = data.data || {};
      return {
        availableCash: Number(equity.available?.cash || 0),
        usedMargin: Number(equity.utilised?.debits || 0),
        totalBalance: Number(equity.net || 0),
      };
    } catch (err) {
      console.error("[ZerodhaAdapter] getFunds error:", err);
      return { availableCash: 0, usedMargin: 0, totalBalance: 0 };
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const res = await fetch(`${this.baseUrl}/portfolio/positions`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await res.json();
      if (!res.ok || !data.data?.net) return [];

      return data.data.net.map((pos: Record<string, unknown>) => ({
        tradingSymbol: String(pos.tradingsymbol || ""),
        exchange: String(pos.exchange || "NSE"),
        productType: String(pos.product || "MIS"),
        netQuantity: Number(pos.quantity || 0),
        buyAvgPrice: Number(pos.buy_price || 0),
        sellAvgPrice: Number(pos.sell_price || 0),
        unrealizedPnL: Number(pos.unrealised || 0),
        realizedPnL: Number(pos.realised || 0),
      }));
    } catch (err) {
      console.error("[ZerodhaAdapter] getPositions error:", err);
      return [];
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    try {
      const exchange = order.exchangeSegment?.includes("FNO")
        ? "NFO"
        : order.exchangeSegment?.includes("BSE")
        ? "BSE"
        : order.exchangeSegment?.includes("MCX")
        ? "MCX"
        : "NSE";

      const kiteOrderType =
        order.orderType === "LIMIT"
          ? "LIMIT"
          : order.orderType === "SL"
          ? "SL"
          : order.orderType === "SL_M"
          ? "SL-M"
          : "MARKET";

      const params = new URLSearchParams();
      params.append("tradingsymbol", order.symbol);
      params.append("exchange", exchange);
      params.append("transaction_type", order.action);
      params.append("order_type", kiteOrderType);
      params.append("quantity", order.quantity.toString());
      params.append("product", order.productType || "MIS");
      params.append("validity", "DAY");
      params.append("tag", order.tag || "ALGODEPLOY");

      if (kiteOrderType === "LIMIT" || kiteOrderType === "SL") {
        params.append("price", (order.price || 0).toString());
      }
      if (kiteOrderType === "SL" || kiteOrderType === "SL-M") {
        params.append("trigger_price", (order.triggerPrice || 0).toString());
      }

      const res = await fetch(`${this.baseUrl}/orders/regular`, {
        method: "POST",
        headers: this.getHeaders(),
        body: params.toString(),
      });

      const data = await res.json();

      if (!res.ok || data.status === "error") {
        return {
          success: false,
          status: "REJECTED",
          message: data.message || "Order rejected by Zerodha",
          rawResponse: data,
        };
      }

      return {
        success: true,
        status: "SUCCESS",
        brokerOrderId: data.data?.order_id,
        message: "Order placed successfully on Zerodha Kite",
        rawResponse: data,
      };
    } catch (err: unknown) {
      return {
        success: false,
        status: "REJECTED",
        message: err instanceof Error ? err.message : "Error executing order on Zerodha",
      };
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/orders/regular/${orderId}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
      const data = await res.json();
      return {
        success: res.ok && data.status !== "error",
        message: data.message || (res.ok ? "Order cancelled" : "Failed to cancel order"),
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error cancelling" };
    }
  }
}

