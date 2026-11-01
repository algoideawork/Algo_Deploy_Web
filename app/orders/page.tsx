"use client";

import React, { useEffect, useState } from "react";
import {
  ScrollText,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface OrderExecution {
  id: string;
  symbol: string;
  transactionType: string;
  productType: string;
  orderType: string;
  quantity: number;
  price?: number;
  status: "PENDING" | "SUCCESS" | "REJECTED" | "CANCELLED";
  broker: string;
  brokerOrderId?: string;
  rejectionReason?: string;
  latencyMs?: number;
  createdAt: string;
  strategy: { name: string; symbol: string };
  brokerAccount: { name: string; broker: string; clientId: string };
}

export default function OrdersPage() {
  const [executions, setExecutions] = useState<OrderExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url =
        filterStatus === "ALL"
          ? "/api/orders"
          : `/api/orders?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setExecutions(data.executions);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = executions.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.symbol.toLowerCase().includes(term) ||
      e.strategy?.name.toLowerCase().includes(term) ||
      e.brokerOrderId?.toLowerCase().includes(term) ||
      e.brokerAccount?.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Live Orders & Execution Audit</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/20">
              {executions.length} Logged
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Complete audit trail of all orders routed across Zerodha, Dhan, and Angel One.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-300 hover:bg-surface-400 text-zinc-200 text-xs font-semibold transition-all border border-border self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-card flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Symbol, Order ID, Strategy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-200 border border-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto w-full md:w-auto">
          {["ALL", "SUCCESS", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === st
                  ? "bg-primary text-black shadow-sm"
                  : "bg-surface-200 text-zinc-400 hover:text-white hover:bg-surface-300"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-200/60 text-zinc-400 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-5">Time (IST)</th>
                <th className="py-3 px-5">Strategy</th>
                <th className="py-3 px-5">Account & Broker</th>
                <th className="py-3 px-5">Symbol</th>
                <th className="py-3 px-5">Side</th>
                <th className="py-3 px-5">Product</th>
                <th className="py-3 px-5">Qty</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Latency</th>
                <th className="py-3 px-5">Broker Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-500">
                    Loading execution logs...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-300/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-zinc-400 whitespace-nowrap">
                      {formatDateTime(e.createdAt)}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-white whitespace-nowrap">
                      {e.strategy?.name || "Direct Webhook"}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-300 text-zinc-300">
                          {e.brokerAccount?.broker || e.broker}
                        </span>
                        <span className="text-xs text-zinc-300">{e.brokerAccount?.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-bold font-mono text-white whitespace-nowrap">
                      {e.symbol}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          e.transactionType === "BUY"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {e.transactionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-zinc-400">{e.productType}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-white">{e.quantity}</td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          e.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : e.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {e.status === "SUCCESS" && <CheckCircle2 className="w-3 h-3" />}
                        {e.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-zinc-400">
                      {e.latencyMs ? `${e.latencyMs}ms` : "-"}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono">
                      {e.brokerOrderId ? (
                        <span className="text-zinc-300">{e.brokerOrderId}</span>
                      ) : e.rejectionReason ? (
                        <span className="text-rose-400 max-w-xs truncate block" title={e.rejectionReason}>
                          {e.rejectionReason}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-500">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No orders matched the filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
