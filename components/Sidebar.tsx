"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  WalletCards,
  Cpu,
  Users,
  ScrollText,
  Zap,
  TrendingUp,
  Shield,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Broker Accounts", href: "/brokers", icon: WalletCards },
  { name: "My Strategies", href: "/strategies", icon: Cpu },
  { name: "Mirror Marketplace", href: "/marketplace", icon: Users },
  { name: "Orders & Logs", href: "/orders", icon: ScrollText },
  { name: "Webhook Tester", href: "/tools/webhook-tester", icon: Zap },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 border-r border-border/70 bg-surface-100 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-border/60 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-dark via-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/20">
            <TrendingUp className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
              Algo<span className="text-primary">Deploy</span>
            </span>
            <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
              INDIAN STOCK AUTO-HUB
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          Menu
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/25 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-surface-300/40"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? "text-primary" : "text-zinc-400"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Supported Brokers Status Banner */}
      <div className="p-4 border-t border-border/60">
        <div className="p-3 rounded-xl bg-surface-200/80 border border-border/40 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 font-medium">Supported Brokers</span>
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
            <div className="bg-surface-300/60 py-1 rounded text-zinc-300 border border-border/30">
              DHAN
            </div>
            <div className="bg-surface-300/60 py-1 rounded text-zinc-300 border border-border/30">
              ZERODHA
            </div>
            <div className="bg-surface-300/60 py-1 rounded text-zinc-300 border border-border/30">
              ANGEL
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
