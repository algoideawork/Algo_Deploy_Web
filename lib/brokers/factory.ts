import { decryptData } from "../encryption";
import { AngelOneAdapter } from "./angel";
import { DhanAdapter } from "./dhan";
import { BrokerCredentials, BrokerType, IBrokerAdapter } from "./types";
import { ZerodhaAdapter } from "./zerodha";

interface RawBrokerRecord {
  broker: BrokerType;
  clientId: string;
  apiKey: string;
  apiSecret?: string | null;
  pin?: string | null;
  totpSecret?: string | null;
  accessToken?: string | null;
}

export function createBrokerAdapter(record: RawBrokerRecord): IBrokerAdapter {
  const credentials: BrokerCredentials = {
    clientId: record.clientId,
    apiKey: decryptData(record.apiKey),
    apiSecret: record.apiSecret ? decryptData(record.apiSecret) : undefined,
    pin: record.pin ? decryptData(record.pin) : undefined,
    totpSecret: record.totpSecret ? decryptData(record.totpSecret) : undefined,
    accessToken: record.accessToken ? decryptData(record.accessToken) : undefined,
  };

  switch (record.broker) {
    case "DHAN":
      return new DhanAdapter(credentials);
    case "ZERODHA":
      return new ZerodhaAdapter(credentials);
    case "ANGEL_ONE":
      return new AngelOneAdapter(credentials);
    default:
      throw new Error(`Unsupported broker type: ${record.broker}`);
  }
}
