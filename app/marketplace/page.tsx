"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Percent,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Copy,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  Trash2,
} from "lucide-react";

interface MarketplaceStrategy {
  id: string;
  name: string;
  description?: string;
  symbol: string;
  exchange: string;
  tags: string[];
  winRate: number;
  roi: number;
  maxDrawdown: number;
  totalTrades: number;
  user: { name: string; email: string };
  _count: { subscriptions: number; executions: number };
}

interface UserBrokerAccount {
  id: string;
  name: string;
  broker: string;
  clientId: string;
  isActive: boolean;
  isLiveTrading: boolean;
}

interface ActiveSubscription {
  id: string;
  multiplier: number;
  maxLots?: number;
  strategy: { id: string; name: string; symbol: string; winRate: number; roi: number };
  brokerAccount: { id: string; name: string; broker: string; clientId: string };
}

export default function MarketplacePage() {
  const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
  const [brokerAccounts, setBrokerAccounts] = useState<UserBrokerAccount[]>([]);
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Copy modal
  const [selectedStrategy, setSelectedStrategy] = useState<MarketplaceStrategy | null>(null);
  const [selectedBrokerId, setSelectedBrokerId] = useState("");
  const [multiplier, setMultiplier] = useState(1.0);
  const [maxLots, setMaxLots] = useState<number | "">("");
  const [subscribing, setSubscribing] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [stratRes, brokerRes, subRes] = await Promise.all([
        fetch("/api/marketplace"),
        fetch("/api/brokers"),
        fetch("/api/subscriptions"),
      ]);

      const [stratData, brokerData, subData] = await Promise.all([
        stratRes.json(),
        brokerRes.json(),
        subRes.json(),
      ]);

      if (stratData.success) setStrategies(stratData.strategies);
      if (brokerData.success) {
        setBrokerAccounts(brokerData.accounts);
        if (brokerData.accounts.length > 0) {
          setSelectedBrokerId(brokerData.accounts[0].id);
        }
      }
      if (subData.success) setSubscriptions(subData.subscriptions);
    } catch (err) {
      console.error("Failed to load marketplace data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategy || !selectedBrokerId) return;

    setSubscribing(true);
    setModalMessage("");

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: selectedStrategy.id,
          brokerAccountId: selectedBrokerId,
          multiplier: Number(multiplier) || 1.0,
          maxLots: maxLots ? Number(maxLots) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalMessage("✓ Mirror setup complete!");
        setTimeout(() => {
          setSelectedStrategy(null);
          setModalMessage("");
          loadAllData();
        }, 1200);
      } else {
        setModalMessage(data.error || "Failed to setup mirror");
      }
    } catch (err) {
      setModalMessage("Error setting up subscription");
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async (subId: string) => {
    if (!confirm("Are you sure you want to stop mirroring this strategy?")) return;
    try {
      await fetch(`/api/subscriptions?id=${subId}`, { method: "DELETE" });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-surface-100 via-surface-100 to-primary/5 border border-border">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mirror Trading Hub</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Strategy Marketplace & Copy Trading
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
          Discover top-performing Indian stock market algorithmic strategies and automatically mirror their positions proportionally into your Dhan, Zerodha, or Angel One accounts.
        </p>
      </div>

      {/* Active Mirrored Subscriptions Section */}
      {subscriptions.length > 0 && (
        <div className="p-5 rounded-2xl glass-card border border-primary/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h3 className="font-bold text-white text-base">Your Active Mirrored Strategies</h3>
            </div>
            <span className="text-xs text-zinc-400">
              Orders automatically replicate when leader fires
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-surface-200/80 border border-border flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-white text-sm">{sub.strategy.name}</h4>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-zinc-300">{sub.brokerAccount.broker}:</span>
                    <span>{sub.brokerAccount.name}</span>
                    <span>•</span>
                    <span className="font-mono text-primary">{sub.multiplier}x Multiplier</span>
                  </p>
                </div>
                <button
                  onClick={() => handleUnsubscribe(sub.id)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Stop Mirroring"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategies Leaderboard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Verified Strategies Leaderboard</h2>
          <span className="text-xs text-zinc-400">{strategies.length} Public Strategies</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading marketplace...</div>
        ) : strategies.length === 0 ? (
          <div className="p-12 rounded-2xl glass-panel text-center text-zinc-500">
            No public strategies available yet. Publish a strategy to see it here!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {strategies.map((strat) => {
              const isAlreadyMirrored = subscriptions.some(
                (sub) => sub.strategy.id === strat.id
              );

              return (
                <div
                  key={strat.id}
                  className="p-6 rounded-2xl glass-card border border-border/80 flex flex-col justify-between space-y-5 hover:border-primary/40 transition-all hover:shadow-xl"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-white text-base leading-tight">
                          {strat.name}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">by {strat.user.name}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-surface-300 text-zinc-300 border border-border/40">
                        {strat.exchange}:{strat.symbol}
                      </span>
                    </div>

                    {/* Description */}
                    {strat.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {strat.description}
                      </p>
                    )}

                    {/* Tags */}
                    {strat.tags && strat.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {strat.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-300/80 text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-200/90 border border-border/60 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                          ROI
                        </span>
                        <span className="text-sm font-extrabold text-emerald-400 font-mono">
                          +{strat.roi}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                          Win Rate
                        </span>
                        <span className="text-sm font-extrabold text-white font-mono">
                          {strat.winRate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                          Drawdown
                        </span>
                        <span className="text-sm font-extrabold text-rose-400 font-mono">
                          -{strat.maxDrawdown}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                      <span>{strat._count.subscriptions} Active Followers</span>
                      <span>{strat.totalTrades} Historical Trades</span>
                    </div>
                  </div>

                  {/* Mirror Button */}
                  <button
                    onClick={() => {
                      setSelectedStrategy(strat);
                      setMultiplier(1.0);
                      setMaxLots("");
                      setModalMessage("");
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isAlreadyMirrored
                        ? "bg-surface-300 text-zinc-200 border border-border hover:bg-surface-400"
                        : "bg-primary hover:bg-primary-dark text-black shadow-lg shadow-primary/20"
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isAlreadyMirrored ? "Configure Mirror" : "Mirror Strategy"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Copy / Mirror Configuration Modal */}
      {selectedStrategy && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-100 border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Mirror {selectedStrategy.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Select your broker account and set lot risk sizing
                </p>
              </div>
              <button
                onClick={() => setSelectedStrategy(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {modalMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  modalMessage.startsWith("✓")
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {modalMessage}
              </div>
            )}

            {brokerAccounts.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-200 border border-border text-center space-y-2">
                <p className="text-xs text-zinc-300">
                  You need to connect a broker account (Dhan, Zerodha, or Angel One) before you can mirror trades.
                </p>
                <Link
                  href="/brokers"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>Connect a Broker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Select Target Broker Account
                  </label>
                  <select
                    value={selectedBrokerId}
                    onChange={(e) => setSelectedBrokerId(e.target.value)}
                    required
                    className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                  >
                    {brokerAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.broker} - {b.clientId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Lot Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    required
                    value={multiplier}
                    onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm font-mono"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    e.g., 1.0 = exact leader lot size; 2.0 = 2x lot size
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Max Lots Safety Cap (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={maxLots}
                    onChange={(e) =>
                      setMaxLots(e.target.value ? parseInt(e.target.value) : "")
                    }
                    className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm font-mono"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Maximum lots placed in a single trade regardless of signal size
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStrategy(null)}
                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black font-bold text-xs shadow-lg shadow-primary/20 transition-all"
                  >
                    {subscribing ? "Activating..." : "Confirm & Start Mirroring"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

