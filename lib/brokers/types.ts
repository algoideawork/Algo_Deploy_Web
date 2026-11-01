export type BrokerType = "DHAN" | "ZERODHA" | "ANGEL_ONE";

export type OrderAction = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "SL" | "SL_M";
export type ProductType = "MIS" | "CNC" | "NRML";
export type ExchangeSegment = "NSE_EQ" | "NSE_FNO" | "BSE_EQ" | "MCX_COMM" | "NSE_CURR";

export interface BrokerCredentials {
  clientId: string;
  apiKey: string;
  apiSecret?: string;
  pin?: string;
  totpSecret?: string;
  accessToken?: string;
}

export interface OrderRequest {
  symbol: string;
  exchangeSegment: ExchangeSegment;
  action: OrderAction;
  productType: ProductType;
  orderType: OrderType;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  securityId?: string; // Specific token ID if known (e.g. Dhan securityId, Angel symbolToken)
  tag?: string;
}

export interface OrderResponse {
  success: boolean;
  brokerOrderId?: string;
  status: "SUCCESS" | "REJECTED" | "PENDING";
  message?: string;
  rawResponse?: unknown;
}

export interface FundsInfo {
  availableCash: number;
  usedMargin: number;
  totalBalance: number;
}

export interface Position {
  tradingSymbol: string;
  exchange: string;
  productType: string;
  netQuantity: number;
  buyAvgPrice: number;
  sellAvgPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface IBrokerAdapter {
  authenticate(): Promise<{ success: boolean; accessToken?: string; message?: string }>;
  getFunds(): Promise<FundsInfo>;
  getPositions(): Promise<Position[]>;
  placeOrder(order: OrderRequest): Promise<OrderResponse>;
  cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }>;
}

