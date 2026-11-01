"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  WalletCards,
  Cpu,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Copy,
  Check,
} from "lucide-react";

interface DashboardStats {
  totalAccounts: number;
  activeStrategies: number;
  totalOrders: number;
  successRate: number;
  recentExecutions: Array<{
    id: string;
    symbol: string;
    transactionType: string;
    productType: string;
    quantity: number;
    status: string;
    broker: string;
    brokerOrderId?: string;
    rejectionReason?: string;
    latencyMs?: number;
    createdAt: string;
    strategy: { name: string };
    brokerAccount: { name: string; broker: string };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel bg-gradient-to-r from-surface-100 via-surface-100 to-surface-300/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>High Frequency Execution Gateway</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Indian Stock Algo & Mirror Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Automate TradingView signals to Zerodha Kite, DhanHQ, and Angel One in sub-seconds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/brokers"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-300 hover:bg-surface-400 text-white text-sm font-medium transition-all border border-border"
          >
            <WalletCards className="w-4 h-4 text-primary" />
            <span>Connect Broker</span>
          </Link>
          <Link
            href="/strategies"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black text-sm font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <Cpu className="w-4 h-4" />
            <span>New Strategy</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connected Brokers */}
        <div className="p-5 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Connected Accounts</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-white">
              {loading ? "..." : stats?.totalAccounts || 0}
            </span>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Dhan, Zerodha, Angel</span>
            </p>
          </div>
        </div>

        {/* Active Algos */}
        <div className="p-5 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Algos</span>
            <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-white">
              {loading ? "..." : stats?.activeStrategies || 0}
            </span>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Listening for Webhooks</span>
            </p>
          </div>
        </div>

        {/* Total Orders Placed */}
        <div className="p-5 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Executions</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-white">
              {loading ? "..." : stats?.totalOrders || 0}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Multi-account routed orders</p>
          </div>
        </div>

        {/* Execution Success Rate */}
        <div className="p-5 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-white">
              {loading ? "..." : `${stats?.successRate || 100}%`}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Sub-second execution</p>
          </div>
        </div>
      </div>

      {/* Broker Quick Connect & Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs">
              DHAN
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">DhanHQ API v2</h4>
              <p className="text-xs text-zinc-400">Direct Free REST API</p>
            </div>
          </div>
          <Link
            href="/brokers"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>Manage</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
              KITE
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Zerodha Kite</h4>
              <p className="text-xs text-zinc-400">Kite Connect 3.0</p>
            </div>
          </div>
          <Link
            href="/brokers"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>Manage</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs">
              ANGEL
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Angel One SmartAPI</h4>
              <p className="text-xs text-zinc-400">Automated Daily TOTP</p>
            </div>
          </div>
          <Link
            href="/brokers"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>Manage</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-border">
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Recent Live Executions</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time audit log of multi-account orders triggered via webhooks
            </p>
          </div>
          <Link
            href="/orders"
            className="text-xs font-medium text-primary hover:text-primary-light flex items-center gap-1"
          >
            <span>View All Logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-200/60 text-zinc-400 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-5">Time</th>
                <th className="py-3 px-5">Strategy</th>
                <th className="py-3 px-5">Broker</th>
                <th className="py-3 px-5">Symbol</th>
                <th className="py-3 px-5">Action</th>
                <th className="py-3 px-5">Qty</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-zinc-300">
              {stats?.recentExecutions && stats.recentExecutions.length > 0 ? (
                stats.recentExecutions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-surface-300/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-zinc-400">
                      {new Date(exec.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-white">
                      {exec.strategy?.name || "Manual Signal"}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-300 text-zinc-300">
                        {exec.brokerAccount?.broker || exec.broker}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold font-mono text-white">
                      {exec.symbol}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          exec.transactionType === "BUY"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {exec.transactionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono">{exec.quantity}</td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          exec.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : exec.status === "SIMULATED"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {exec.status === "SUCCESS" && <CheckCircle2 className="w-3 h-3" />}
                        {exec.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                        {exec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-zinc-400">
                      {exec.latencyMs ? `${exec.latencyMs}ms` : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No order executions recorded yet.</p>
                    <p className="text-xs mt-1">
                      Connect your broker and send a test webhook alert to see live executions!
                    </p>
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

