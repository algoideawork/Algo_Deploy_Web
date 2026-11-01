"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Bell, ShieldCheck, Zap } from "lucide-react";

export default function Navbar() {
  const [marketOpen, setMarketOpen] = useState(false);
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const checkMarket = () => {
      // Calculate current IST time
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const istTime = new Date(utcTime + 3600000 * 5.5);

      const day = istTime.getDay(); // 0 is Sun, 6 is Sat
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const currentMin = hours * 60 + minutes;

      const isWeekday = day >= 1 && day <= 5;
      const isOpen = isWeekday && currentMin >= 555 && currentMin <= 930; // 9:15 AM to 3:30 PM IST

      setMarketOpen(isOpen);
      setTimeString(
        istTime.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    checkMarket();
    const interval = setInterval(checkMarket, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-surface-100/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Market Status indicator */}
        <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-surface-300/40 border border-border text-xs">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              marketOpen ? "bg-primary animate-pulse" : "bg-zinc-500"
            }`}
          />
          <span className="font-medium text-zinc-300">
            {marketOpen ? "NSE / BSE Live" : "Market Closed"}
          </span>
          <span className="text-zinc-500">|</span>
          <span className="font-mono text-zinc-400">{timeString} IST</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Non-custodial badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-surface-200/50 px-3 py-1 rounded-md border border-border/40">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Non-Custodial AES-256</span>
        </div>

        {/* Quick Test Webhook link */}
        <Link
          href="/tools/webhook-tester"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Webhook Tester</span>
        </Link>
      </div>
    </header>
  );
}

