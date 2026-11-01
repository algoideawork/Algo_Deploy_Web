"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu,
  Plus,
  Copy,
  Check,
  Zap,
  Globe,
  Lock,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Code2,
} from "lucide-react";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/client-cache";

interface Strategy {
  id: string;
  name: string;
  description?: string;
  symbol: string;
  exchange: string;
  webhookToken: string;
  isPublic: boolean;
  isLive: boolean;
  riskMultiplierDefault: number;
  tags: string[];
  winRate: number;
  roi: number;
  totalTrades: number;
  _count: {
    subscriptions: number;
    signals: number;
    executions: number;
  };
}

export default function StrategiesPage() {
  const cached = getCachedData<Strategy[]>("user_strategies");
  const [strategies, setStrategies] = useState<Strategy[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStrategyForPayload, setSelectedStrategyForPayload] = useState<Strategy | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    symbol: "NIFTY",
    exchange: "NSE",
    isPublic: true,
    riskMultiplierDefault: 1.0,
    tags: "Intraday, Momentum",
  });
  const [submitting, setSubmitting] = useState(false);

  const appBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.vercel.app";

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const res = await fetch("/api/strategies");
      const data = await res.json();
      if (data.success) {
        setStrategies(data.strategies);
        setCachedData("user_strategies", data.strategies);
      }
    } catch (err) {
      console.error("Failed to load strategies", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          name: "",
          description: "",
          symbol: "NIFTY",
          exchange: "NSE",
          isPublic: true,
          riskMultiplierDefault: 1.0,
          tags: "Intraday, Momentum",
        });
        fetchStrategies();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: !current }),
      });
      fetchStrategies();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this strategy?")) return;
    try {
      await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      fetchStrategies();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getTradingViewAlertPayload = (s: Strategy) => {
    return JSON.stringify(
      {
        action: "{{strategy.order.action}}", // or "BUY" / "SELL"
        symbol: s.symbol,
        exchangeSegment: s.exchange === "NFO" ? "NSE_FNO" : "NSE_EQ",
        quantity: 50,
        productType: "MIS",
        orderType: "MARKET",
        price: "{{close}}",
      },
      null,
      2
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>My Strategies</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/20">
              {strategies.length} Configured
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Deploy TradingView PineScript alerts and Python algos with zero code changes.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black font-bold text-sm shadow-lg shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Algo Webhook</span>
        </button>
      </div>

      {/* Strategies List */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500">Loading strategies...</div>
      ) : strategies.length === 0 ? (
        <div className="p-12 rounded-2xl glass-panel text-center space-y-4 border border-dashed border-border">
          <div className="w-12 h-12 rounded-2xl bg-surface-300 text-zinc-400 flex items-center justify-center mx-auto">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Trading Strategies Created Yet</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
              Create your first strategy to generate a dedicated TradingView webhook endpoint and replicate trades across all connected accounts.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Strategy</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {strategies.map((s) => {
            const webhookUrl = `${appBaseUrl}/api/v1/webhook/${s.webhookToken}`;
            const isCopied = copiedToken === s.id;

            return (
              <div
                key={s.id}
                className="p-5 rounded-2xl glass-card border border-border/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Info */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        s.isLive ? "bg-primary animate-pulse" : "bg-zinc-500"
                      }`}
                    />
                    <h3 className="font-extrabold text-white text-base">{s.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-surface-300 text-zinc-300 border border-border/40">
                      {s.exchange}:{s.symbol}
                    </span>
                    {s.isPublic ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        <Globe className="w-3 h-3" /> Public Mirror
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 bg-surface-300 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    )}
                  </div>

                  {s.description && (
                    <p className="text-xs text-zinc-400 leading-relaxed">{s.description}</p>
                  )}

                  {/* Webhook URL Field */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold uppercase text-zinc-500">
                      Webhook:
                    </span>
                    <div className="flex items-center gap-1.5 bg-surface-200/90 px-3 py-1.5 rounded-lg border border-border text-xs font-mono text-zinc-300 max-w-md truncate">
                      <span className="truncate">{webhookUrl}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(webhookUrl, s.id)}
                      className="p-1.5 rounded-lg bg-surface-300 hover:bg-surface-400 text-zinc-300 text-xs transition-colors"
                      title="Copy Webhook URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Metrics & Actions */}
                <div className="flex flex-wrap items-center gap-4 lg:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/60">
                  <div className="text-center sm:text-right">
                    <div className="text-xs text-zinc-500 font-medium">Followers</div>
                    <div className="text-base font-bold text-white font-mono">
                      {s._count.subscriptions}
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <div className="text-xs text-zinc-500 font-medium">Signals</div>
                    <div className="text-base font-bold text-white font-mono">
                      {s._count.signals}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View JSON Payload */}
                    <button
                      onClick={() => setSelectedStrategyForPayload(s)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-300 hover:bg-surface-400 text-zinc-200 text-xs font-semibold transition-all border border-border"
                      title="Generate TradingView JSON Alert Payload"
                    >
                      <Code2 className="w-3.5 h-3.5 text-secondary" />
                      <span>Alert Payload</span>
                    </button>

                    {/* Test simulator button */}
                    <Link
                      href={`/tools/webhook-tester?token=${s.webhookToken}&symbol=${s.symbol}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all border border-primary/20"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Test Fire</span>
                    </Link>

                    {/* Toggle Live */}
                    <button
                      onClick={() => handleToggleLive(s.id, s.isLive)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        s.isLive
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                      }`}
                      title={s.isLive ? "Pause Strategy" : "Resume Strategy"}
                    >
                      {s.isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Strategy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TradingView JSON Alert Payload Modal */}
      {selectedStrategyForPayload && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-100 border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  TradingView Alert Setup for {selectedStrategyForPayload.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Copy and paste these exact settings into your TradingView Alert dialog.
                </p>
              </div>
              <button
                onClick={() => setSelectedStrategyForPayload(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Webhook URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase block">
                1. Webhook URL (Paste into TradingView Notification tab)
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${appBaseUrl}/api/v1/webhook/${selectedStrategyForPayload.webhookToken}`}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3 py-2 text-xs font-mono text-primary focus:outline-none"
                />
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${appBaseUrl}/api/v1/webhook/${selectedStrategyForPayload.webhookToken}`,
                      "modal-url"
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-surface-300 hover:bg-surface-400 text-xs font-semibold text-white"
                >
                  {copiedToken === "modal-url" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Step 2: JSON Payload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase block">
                2. Message / JSON Body (Paste into TradingView Message box)
              </label>
              <textarea
                readOnly
                rows={9}
                value={getTradingViewAlertPayload(selectedStrategyForPayload)}
                className="w-full bg-surface-200 border border-border rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none leading-relaxed"
              />
              <button
                onClick={() =>
                  copyToClipboard(
                    getTradingViewAlertPayload(selectedStrategyForPayload),
                    "modal-body"
                  )
                }
                className="w-full py-2 rounded-xl bg-primary text-black font-bold text-xs shadow-md shadow-primary/20"
              >
                {copiedToken === "modal-body" ? "✓ Payload Copied!" : "Copy JSON Alert Body"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-100 border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">New Trading Strategy</h3>
                  <p className="text-xs text-zinc-400">Generate a unique webhook execution bridge</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Strategy Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BankNifty Supertrend Breakout"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of logic, timeframe, or risk management..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Symbol
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="NIFTY, BANKNIFTY, RELIANCE"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Exchange
                  </label>
                  <select
                    value={formData.exchange}
                    onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                  >
                    <option value="NSE">NSE (Cash/Equity)</option>
                    <option value="NFO">NFO (Futures & Options)</option>
                    <option value="BSE">BSE</option>
                    <option value="MCX">MCX (Commodity)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Intraday, Scalping, F&O"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Risk Multiplier Default
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.riskMultiplierDefault}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        riskMultiplierDefault: parseFloat(e.target.value) || 1.0,
                      })
                    }
                    className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-200 border border-border">
                <div>
                  <span className="font-semibold text-xs text-white block">
                    Public in Mirror Marketplace
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Allow other traders to discover and copy this strategy
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black font-bold text-xs shadow-lg shadow-primary/20 transition-all"
                >
                  {submitting ? "Generating Webhook..." : "Create Strategy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

