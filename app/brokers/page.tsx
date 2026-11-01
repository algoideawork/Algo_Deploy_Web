"use client";

import React, { useEffect, useState } from "react";
import {
  WalletCards,
  Plus,
  RefreshCw,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Lock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/client-cache";

interface BrokerAccount {
  id: string;
  name: string;
  broker: "DHAN" | "ZERODHA" | "ANGEL_ONE";
  clientId: string;
  isActive: boolean;
  isLiveTrading: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  errorMessage?: string;
  _count: {
    subscriptions: number;
    executions: number;
  };
}

export default function BrokersPage() {
  const cachedAccounts = getCachedData<BrokerAccount[]>("broker_accounts");
  const [accounts, setAccounts] = useState<BrokerAccount[]>(cachedAccounts || []);
  const [loading, setLoading] = useState(!cachedAccounts);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ id: string; msg: string; funds?: any } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    broker: "DHAN",
    clientId: "",
    apiKey: "",
    apiSecret: "",
    pin: "",
    totpSecret: "",
    accessToken: "",
    isLiveTrading: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/brokers");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
        setCachedData("broker_accounts", data.accounts);
        setDbError(null);
      } else {
        setDbError(data.error);
      }
    } catch (err) {
      console.error("Failed to load accounts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        setFormError(data.error || "Failed to add broker account");
        return;
      }

      setShowAddModal(false);
      setFormData({
        name: "",
        broker: "DHAN",
        clientId: "",
        apiKey: "",
        apiSecret: "",
        pin: "",
        totpSecret: "",
        accessToken: "",
        isLiveTrading: true,
      });
      fetchAccounts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error connecting to server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    setSyncFeedback(null);
    try {
      const res = await fetch(`/api/brokers/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback({
          id,
          msg: data.message || "Synchronized!",
          funds: data.funds,
        });
      } else {
        setSyncFeedback({ id, msg: data.error || "Sync failed" });
      }
      fetchAccounts();
    } catch (err) {
      setSyncFeedback({ id, msg: "Network error during sync" });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this broker account?")) return;
    try {
      await fetch(`/api/brokers/${id}`, { method: "DELETE" });
      fetchAccounts();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleToggleTrading = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/brokers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLiveTrading: !current }),
      });
      fetchAccounts();
    } catch (err) {
      console.error("Failed to toggle trading mode", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Broker Accounts</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/20">
              {accounts.length} Connected
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Connect and manage your Zerodha Kite, DhanHQ, and Angel One trading terminals.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black font-bold text-sm shadow-lg shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Broker Account</span>
        </button>
      </div>

      {/* Database Connection Alert */}
      {dbError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>PostgreSQL Database Not Connected</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {dbError}
          </p>
          <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-300">
            <span className="bg-surface-300/60 px-2 py-1 rounded">1. Get free Postgres URL from <b>Neon.tech</b> or <b>Supabase</b></span>
            <span className="bg-surface-300/60 px-2 py-1 rounded">2. Paste in <b>.env</b> (DATABASE_URL=...)</span>
            <span className="bg-surface-300/60 px-2 py-1 rounded">3. Run: <b>npm run build</b> to sync schema</span>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="p-12 rounded-2xl glass-panel text-center space-y-4 border border-dashed border-border">
          <div className="w-12 h-12 rounded-2xl bg-surface-300 text-zinc-400 flex items-center justify-center mx-auto">
            <WalletCards className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Broker Accounts Connected Yet</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
              Add your Dhan, Zerodha, or Angel One credentials to start automating TradingView alerts and copy trading.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Connect First Broker</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const isSyncing = syncingId === acc.id;
            const feedback = syncFeedback?.id === acc.id ? syncFeedback : null;

            return (
              <div
                key={acc.id}
                className="p-5 rounded-2xl glass-card border border-border/80 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          acc.broker === "DHAN"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : acc.broker === "ZERODHA"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {acc.broker === "DHAN"
                          ? "DHAN"
                          : acc.broker === "ZERODHA"
                          ? "KITE"
                          : "ANGEL"}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-snug">{acc.name}</h3>
                        <p className="text-xs font-mono text-zinc-400">ID: {acc.clientId}</p>
                      </div>
                    </div>

                    {/* Live vs Paper Badge */}
                    <button
                      onClick={() => handleToggleTrading(acc.id, acc.isLiveTrading)}
                      title="Click to toggle between Live and Paper Trading"
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                        acc.isLiveTrading
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {acc.isLiveTrading ? "LIVE TRADING" : "PAPER TRADING"}
                    </button>
                  </div>

                  {/* Sync status & metrics */}
                  <div className="mt-4 pt-3 border-t border-border/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Connection Status:</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          acc.lastSyncStatus === "SUCCESS"
                            ? "text-emerald-400"
                            : acc.lastSyncStatus === "FAILED"
                            ? "text-rose-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {acc.lastSyncStatus === "SUCCESS" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {acc.lastSyncStatus || "UNCHECKED"}
                      </span>
                    </div>

                    {acc.errorMessage && (
                      <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                        {acc.errorMessage}
                      </p>
                    )}

                    {feedback && feedback.funds && (
                      <div className="bg-surface-300/40 p-2.5 rounded-lg border border-border space-y-1">
                        <div className="flex justify-between text-zinc-300 font-medium">
                          <span>Available Cash:</span>
                          <span className="font-mono text-primary">
                            {formatINR(feedback.funds.availableCash)}
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-400 text-[11px]">
                          <span>Used Margin:</span>
                          <span className="font-mono">{formatINR(feedback.funds.usedMargin)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                      <span>Mirrored Algos: {acc._count.subscriptions}</span>
                      <span>Total Executions: {acc._count.executions}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSync(acc.id)}
                    disabled={isSyncing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-300 hover:bg-surface-400 text-zinc-200 text-xs font-semibold transition-all border border-border"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
                    <span>{isSyncing ? "Checking..." : "Sync & Test"}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Broker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-100 border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Connect Broker Account</h3>
                  <p className="text-xs text-zinc-400">Non-custodial API key connection</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddAccount} className="space-y-4 text-sm">
              {/* Account Label */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Account Name / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Primary Dhan Scalping or Zerodha Main"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Broker Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Select Broker
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["DHAN", "ZERODHA", "ANGEL_ONE"] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFormData({ ...formData, broker: b })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.broker === b
                          ? "bg-primary/10 text-primary border-primary shadow-sm"
                          : "bg-surface-200 text-zinc-400 border-border hover:bg-surface-300"
                      }`}
                    >
                      {b === "DHAN" ? "Dhan (Free)" : b === "ZERODHA" ? "Zerodha" : "Angel One"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client ID / User ID */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  {formData.broker === "ZERODHA"
                    ? "Kite User ID (e.g. AB1234)"
                    : formData.broker === "DHAN"
                    ? "Dhan Client ID (e.g. 1100345678)"
                    : "Angel One Client Code (e.g. S123456)"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Client Code / User ID"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste your Broker API Key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm font-mono text-xs"
                />
              </div>

              {/* Conditional Broker Fields */}
              {formData.broker === "ZERODHA" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                      API Secret
                    </label>
                    <input
                      type="password"
                      placeholder="Zerodha Kite API Secret"
                      value={formData.apiSecret}
                      onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                      className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                      Daily Access Token
                    </label>
                    <input
                      type="text"
                      placeholder="Access Token from Kite login"
                      value={formData.accessToken}
                      onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                      className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm font-mono text-xs"
                    />
                  </div>
                </>
              )}

              {formData.broker === "ANGEL_ONE" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                      Trading MPIN / PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Your 4 or 6 digit MPIN"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                      TOTP Secret Key (For Automated Daily Login)
                    </label>
                    <input
                      type="text"
                      placeholder="Base32 TOTP Secret from Angel Authenticator setup"
                      value={formData.totpSecret}
                      onChange={(e) => setFormData({ ...formData, totpSecret: e.target.value })}
                      className="w-full bg-surface-200 border border-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-primary text-sm font-mono text-xs"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Enables the platform to generate daily login tokens automatically without manual intervention.
                    </p>
                  </div>
                </>
              )}

              {/* Trading Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-200 border border-border">
                <div>
                  <span className="font-semibold text-xs text-white block">Live Trading Mode</span>
                  <span className="text-[11px] text-zinc-400">
                    When off, orders are simulated in paper trading mode.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isLiveTrading}
                  onChange={(e) => setFormData({ ...formData, isLiveTrading: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
              </div>

              {/* Security Banner */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-300/40 text-[11px] text-zinc-400 border border-border/40">
                <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  Credentials are encrypted using AES-256-GCM before storage. We never ask for withdrawal permissions.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black font-bold text-xs shadow-lg shadow-primary/20 transition-all"
                >
                  {submitting ? "Validating & Saving..." : "Connect Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

