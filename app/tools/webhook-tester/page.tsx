"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Code2,
  RefreshCw,
  Cpu,
} from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  symbol: string;
  exchange: string;
  webhookToken: string;
}

function WebhookTesterContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";
  const initialSymbol = searchParams.get("symbol") || "NIFTY";

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedToken, setSelectedToken] = useState(initialToken);
  const [action, setAction] = useState<"BUY" | "SELL" | "SQUAREOFF">("BUY");
  const [symbol, setSymbol] = useState(initialSymbol);
  const [quantity, setQuantity] = useState(50);
  const [productType, setProductType] = useState<"MIS" | "CNC" | "NRML">("MIS");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [price, setPrice] = useState<number | "">("");

  const [firing, setFiring] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/strategies")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.strategies.length > 0) {
          setStrategies(data.strategies);
          if (!selectedToken) {
            setSelectedToken(data.strategies[0].webhookToken);
            setSymbol(data.strategies[0].symbol);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleStrategyChange = (token: string) => {
    setSelectedToken(token);
    const found = strategies.find((s) => s.webhookToken === token);
    if (found) {
      setSymbol(found.symbol);
    }
  };

  const handleFireWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFiring(true);
    setExecutionResult(null);
    setErrorMsg(null);

    const payload = {
      webhookToken: selectedToken,
      action,
      symbol: symbol.toUpperCase(),
      quantity: Number(quantity) || 1,
      productType,
      orderType,
      ...(price ? { price: Number(price) } : {}),
    };

    try {
      const res = await fetch("/api/simulate-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setExecutionResult(data.result);
      } else {
        setErrorMsg(data.error || "Execution failed");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    } finally {
      setFiring(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-surface-100 via-surface-100 to-amber-500/10 border border-border">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
          <Zap className="w-3.5 h-3.5" />
          <span>Interactive Signal Simulator</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          TradingView Webhook Alert Tester
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Test firing alerts directly to your strategy webhook and inspect multi-account order execution, lot sizing, and latency in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Signal Config Form (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl glass-card border border-border space-y-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-bold text-white text-base">Signal Parameters</h3>
            <span className="text-xs text-zinc-400">Simulates incoming alert</span>
          </div>

          <form onSubmit={handleFireWebhook} className="space-y-4 text-sm">
            {/* Target Strategy Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                Target Strategy
              </label>
              {strategies.length > 0 ? (
                <select
                  value={selectedToken}
                  onChange={(e) => handleStrategyChange(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm font-medium"
                >
                  {strategies.map((s) => (
                    <option key={s.id} value={s.webhookToken}>
                      {s.name} ({s.symbol}) - Token: {s.webhookToken.slice(0, 8)}...
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter custom webhookToken"
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-primary"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                Order Action
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAction("BUY")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    action === "BUY"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-sm"
                      : "bg-surface-200 text-zinc-400 border-border hover:bg-surface-300"
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setAction("SELL")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    action === "SELL"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500 shadow-sm"
                      : "bg-surface-200 text-zinc-400 border-border hover:bg-surface-300"
                  }`}
                >
                  SELL / SHORT
                </button>
                <button
                  type="button"
                  onClick={() => setAction("SQUAREOFF")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    action === "SQUAREOFF"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500 shadow-sm"
                      : "bg-surface-200 text-zinc-400 border-border hover:bg-surface-300"
                  }`}
                >
                  SQUARE OFF
                </button>
              </div>
            </div>

            {/* Symbol & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Trading Symbol
                </label>
                <input
                  type="text"
                  required
                  placeholder="NIFTY, BANKNIFTY, RELIANCE"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white font-mono text-xs uppercase focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Base Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Product & Order Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Product Type
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as any)}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-xs"
                >
                  <option value="MIS">MIS (Intraday)</option>
                  <option value="CNC">CNC (Cash Delivery)</option>
                  <option value="NRML">NRML (F&O Carryforward)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-xs"
                >
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                </select>
              </div>
            </div>

            {orderType === "LIMIT" && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Limit Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="e.g. 2450.50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : "")}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={firing || !selectedToken}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-black font-extrabold text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all"
            >
              <Zap className={`w-4 h-4 ${firing ? "animate-bounce" : ""}`} />
              <span>{firing ? "Broadcasting to Accounts..." : "Fire Webhook Alert"}</span>
            </button>
          </form>
        </div>

        {/* Execution Response Inspector (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl glass-card border border-border space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-white text-base">Execution Inspector</h3>
              {executionResult && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400">
                  {executionResult.successCount}/{executionResult.totalSubscribers} Success
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            {executionResult ? (
              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-xl bg-surface-200 border border-border space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Signal ID:</span>
                    <span className="text-zinc-200">{executionResult.signalLogId.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Accounts Mirrored:</span>
                    <span className="text-primary font-bold">{executionResult.totalSubscribers}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Successful Orders:</span>
                    <span className="text-emerald-400 font-bold">{executionResult.successCount}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Failed / Rejected:</span>
                    <span className="text-rose-400 font-bold">{executionResult.failedCount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase">
                    Account-by-Account Details:
                  </h4>
                  {executionResult.executions.map((exec: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-surface-200/60 border border-border/60 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-300 font-bold text-zinc-300">
                            {exec.broker}
                          </span>
                          <span className="font-medium text-white">{exec.brokerName}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exec.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : exec.status === "SIMULATED"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {exec.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span>Quantity: {exec.quantity}</span>
                        <span>Latency: {exec.latencyMs}ms</span>
                      </div>
                      {exec.brokerOrderId && (
                        <p className="text-[10px] font-mono text-zinc-500 truncate">
                          Order ID: {exec.brokerOrderId}
                        </p>
                      )}
                      {exec.rejectionReason && (
                        <p className="text-[10px] text-rose-400 bg-rose-500/10 p-1.5 rounded">
                          {exec.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center text-zinc-500 space-y-2">
                <Code2 className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">
                  Fill in the signal parameters and click <b>Fire Webhook Alert</b> to see execution details.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border/40 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Powered by BullMQ / Async Order Router</span>
            <span className="font-mono text-primary">Sub-200ms Execution</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WebhookTesterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading simulator...</div>}>
      <WebhookTesterContent />
    </Suspense>
  );
}
