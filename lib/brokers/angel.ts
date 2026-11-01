import * as OTPAuth from "otpauth";
import {
  BrokerCredentials,
  FundsInfo,
  IBrokerAdapter,
  OrderRequest,
  OrderResponse,
  Position,
} from "./types";

export class AngelOneAdapter implements IBrokerAdapter {
  private credentials: BrokerCredentials;
  private baseUrl = "https://apiconnect.angelone.in";

  constructor(credentials: BrokerCredentials) {
    this.credentials = credentials;
  }

  private generateTOTP(): string {
    if (!this.credentials.totpSecret) {
      throw new Error("Angel One requires a TOTP secret for automated login.");
    }
    // Clean secret (remove spaces)
    const cleanSecret = this.credentials.totpSecret.replace(/\s+/g, "").toUpperCase();
    const totp = new OTPAuth.TOTP({
      issuer: "AngelOne",
      label: this.credentials.clientId,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(cleanSecret),
    });
    return totp.generate();
  }

  private getCommonHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-UserType": "USER",
      "X-SourceID": "WEB",
      "X-PrivateKey": this.credentials.apiKey,
      "X-ClientLocalIP": "127.0.0.1",
      "X-ClientPublicIP": "106.193.147.98",
      "X-MACAddress": "fe80::216e:6507:4b90:3719",
    };

    if (this.credentials.accessToken) {
      headers["Authorization"] = `Bearer ${this.credentials.accessToken}`;
    }

    return headers;
  }

  async authenticate(): Promise<{ success: boolean; accessToken?: string; message?: string }> {
    try {
      if (!this.credentials.pin || !this.credentials.totpSecret) {
        if (this.credentials.accessToken) {
          return { success: true, accessToken: this.credentials.accessToken, message: "Using stored session" };
        }
        return {
          success: false,
          message: "Angel One requires PIN (MPIN) and TOTP Secret for automated authentication.",
        };
      }

      const totpToken = this.generateTOTP();

      const res = await fetch(`${this.baseUrl}/rest/auth/partner/v1/loginByPassword`, {
        method: "POST",
        headers: this.getCommonHeaders(),
        body: JSON.stringify({
          clientcode: this.credentials.clientId,
          password: this.credentials.pin,
          totp: totpToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.status || !data.data?.jwtToken) {
        return {
          success: false,
          message: data.message || "Failed to authenticate with Angel One SmartAPI",
        };
      }

      this.credentials.accessToken = data.data.jwtToken;

      return {
        success: true,
        accessToken: data.data.jwtToken,
        message: "Successfully authenticated with Angel One SmartAPI",
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Error authenticating with Angel One",
      };
    }
  }

  async getFunds(): Promise<FundsInfo> {
    try {
      const res = await fetch(`${this.baseUrl}/rest/secure/angelbroking/user/v1/getRMS`, {
        method: "GET",
        headers: this.getCommonHeaders(),
      });

      const data = await res.json();
      if (!res.ok || !data.data) {
        return { availableCash: 0, usedMargin: 0, totalBalance: 0 };
      }

      const availableCash = Number(data.data.net || data.data.availablecash || 0);
      const usedMargin = Number(data.data.utilisedamount || 0);

      return {
        availableCash,
        usedMargin,
        totalBalance: availableCash + usedMargin,
      };
    } catch (err) {
      console.error("[AngelOneAdapter] getFunds error:", err);
      return { availableCash: 0, usedMargin: 0, totalBalance: 0 };
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const res = await fetch(`${this.baseUrl}/rest/secure/angelbroking/order/v1/getPosition`, {
        method: "GET",
        headers: this.getCommonHeaders(),
      });

      const data = await res.json();
      if (!res.ok || !Array.isArray(data.data)) return [];

      return data.data.map((pos: Record<string, unknown>) => ({
        tradingSymbol: String(pos.tradingsymbol || ""),
        exchange: String(pos.exchange || "NSE"),
        productType: String(pos.producttype || "INTRADAY"),
        netQuantity: Number(pos.netqty || 0),
        buyAvgPrice: Number(pos.buyavgprice || 0),
        sellAvgPrice: Number(pos.sellavgprice || 0),
        unrealizedPnL: Number(pos.unrealised || 0),
        realizedPnL: Number(pos.realised || 0),
      }));
    } catch (err) {
      console.error("[AngelOneAdapter] getPositions error:", err);
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

      const productType =
        order.productType === "CNC"
          ? "DELIVERY"
          : order.productType === "NRML"
          ? "CARRYFORWARD"
          : "INTRADAY";

      const orderType =
        order.orderType === "LIMIT"
          ? "LIMIT"
          : order.orderType === "SL"
          ? "STOPLOSS_LIMIT"
          : order.orderType === "SL_M"
          ? "STOPLOSS_MARKET"
          : "MARKET";

      const payload = {
        variety: "NORMAL",
        tradingsymbol: order.symbol,
        symboltoken: order.securityId || "3045", // Standard token mapping
        transactiontype: order.action,
        exchange: exchange,
        ordertype: orderType,
        producttype: productType,
        duration: "DAY",
        price: (order.orderType === "LIMIT" ? order.price || 0 : 0).toString(),
        squareoff: "0",
        stoploss: (order.triggerPrice || 0).toString(),
        quantity: order.quantity.toString(),
      };

      const res = await fetch(`${this.baseUrl}/rest/secure/angelbroking/order/v1/placeOrder`, {
        method: "POST",
        headers: this.getCommonHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.status) {
        return {
          success: false,
          status: "REJECTED",
          message: data.message || "Order rejected by Angel One",
          rawResponse: data,
        };
      }

      return {
        success: true,
        status: "SUCCESS",
        brokerOrderId: data.data?.orderid,
        message: "Order placed successfully on Angel One",
        rawResponse: data,
      };
    } catch (err: unknown) {
      return {
        success: false,
        status: "REJECTED",
        message: err instanceof Error ? err.message : "Error executing order on Angel One",
      };
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/rest/secure/angelbroking/order/v1/cancelOrder`, {
        method: "POST",
        headers: this.getCommonHeaders(),
        body: JSON.stringify({ variety: "NORMAL", orderid: orderId }),
      });
      const data = await res.json();
      return {
        success: res.ok && data.status,
        message: data.message || (res.ok ? "Order cancelled" : "Failed to cancel order"),
      };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error cancelling" };
    }
  }
}

