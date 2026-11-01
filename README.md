# AlgoDeploy | Indian Stock Algorithmic & Copy-Trading Hub

An enterprise-grade, non-custodial algorithmic deployment and copy-trading platform tailored exclusively for the Indian Stock Market (**NSE, BSE, MCX**). Built with **Next.js 15 (App Router)**, **TypeScript**, and **Prisma ORM with PostgreSQL**, designed for direct deployment to **Vercel**.

---

## 🌟 Key Platform Features

- **Multi-Broker Architecture:**
  - **DhanHQ (API v2):** Direct free REST trading and data execution.
  - **Zerodha (Kite Connect 3.0):** OAuth token verification, equity and F&O execution.
  - **Angel One (SmartAPI):** Automated 24/7 daily login session renewal powered by built-in TOTP generation (no daily manual re-login needed).
- **Sub-Second Signal Ingestion Gateway:**
  - High-throughput webhook endpoint (`/api/v1/webhook/[token]`) for TradingView alerts, Python bots, and PineScript strategies.
- **Master-to-Slave Copy Trading (Mirror Hub):**
  - Proportional lot sizing across multiple follower accounts simultaneously.
  - Risk caps (Max lots per trade, max daily loss cut-offs).
  - Live Trading mode vs Paper Trading mode toggle per account.
- **Zero-Trust Security (Non-Custodial):**
  - All broker API keys, secrets, PINs, and TOTP seeds are encrypted at rest using **AES-256-GCM**.
  - Platform never requires or accepts fund withdrawal permissions.
- **Built-in Webhook Tester & Simulator:**
  - Test alert execution, lot sizing calculations, and latency right from your browser.
- **Single-Repo Vercel Deployment:**
  - All files reside in one unified workspace with no complex sub-repositories—ready for zero-configuration deployment to Vercel.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Signal Sources
        TV[TradingView Webhook Alert]
        PY[Python Algo / PineScript]
        SIM[Built-in Webhook Tester]
    end

    subgraph AlgoDeploy Platform (Vercel)
        WH[Webhook Gateway: /api/v1/webhook/[token]]
        Vault[AES-256 Key Vault & Decryption]
        Router[Multi-Account Routing Engine]
        DB[(PostgreSQL + Prisma)]
    end

    subgraph Indian Stock Brokers
        Dhan[DhanHQ API v2]
        Kite[Zerodha Kite Connect]
        Angel[Angel One SmartAPI]
    end

    TV --> WH
    PY --> WH
    SIM --> WH
    WH --> Router
    Vault --> Router
    Router --> DB
    Router -->|Parallel Execution| Dhan
    Router -->|Parallel Execution| Kite
    Router -->|Parallel Execution| Angel
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **PostgreSQL Database**: Free cloud instance from [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres).

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@ep-host.pooler.neon.tech/algodeploy?sslmode=require"

# 32-byte secret key for AES-256 encryption of broker API keys
ENCRYPTION_SECRET_KEY="c4f8a12398b76543210fedcba0987654c4f8a12398b76543210fedcba0987654"

# Application Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Migration & Prisma Generation
```bash
# Push database schema to PostgreSQL
npx prisma db push

# (Optional) Seed sample strategies
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 TradingView Webhook Payload Specification

When creating alerts in TradingView, set the **Webhook URL** to:
```
https://your-domain.vercel.app/api/v1/webhook/YOUR_STRATEGY_TOKEN
```

And in the **Message** body:

### Intraday Buy (MIS) Example:
```json
{
  "action": "BUY",
  "symbol": "NIFTY",
  "exchangeSegment": "NSE_FNO",
  "quantity": 50,
  "productType": "MIS",
  "orderType": "MARKET",
  "price": {{close}}
}
```

### Dynamic Strategy Alerts (PineScript):
```json
{
  "action": "{{strategy.order.action}}",
  "symbol": "BANKNIFTY",
  "exchangeSegment": "NSE_FNO",
  "quantity": {{strategy.order.contracts}},
  "productType": "MIS",
  "orderType": "MARKET",
  "price": {{close}}
}
```

---

## 🚢 Deploying to Vercel

1. Push this workspace to your GitHub / GitLab repository.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
3. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `ENCRYPTION_SECRET_KEY`: A random 32-character or 64-character hex string.
   - `NEXT_PUBLIC_APP_URL`: Your production Vercel domain (e.g. `https://my-algo-hub.vercel.app`).
4. Click **Deploy**. Vercel will automatically run `next build` and deploy your complete trading platform!
