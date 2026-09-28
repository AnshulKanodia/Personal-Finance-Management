# 💰 RupeePulse — Personal Finance Management (PWA)

> **High-Performance Indian Financial Ledger, Quantitative Analytics & Progressive Web App**  
> A private, single-user Personal Finance Management Progressive Web App (PWA) tailored for the Indian currency system (INR). Engineered with Next.js 14 App Router, OLED cosmic design, bilateral friend ledger passbooks, zero-latency SWR caching, official PDF/Excel statement exports, and a polyglot quantitative analytics suite (Go & Python).

[![Next.js](https://img.shields.io/badge/Framework-Next.js_14_App_Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Engine-Python_3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![Go](https://img.shields.io/badge/CLI-Go_1.22+-00ADD8?style=flat&logo=go&logoColor=white)](https://golang.org/)
[![SQL](https://img.shields.io/badge/Database-PostgreSQL_14+-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_OLED_Dark-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/NoSQL-MongoDB_Atlas_Serverless-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

## 📌 Overview & Small Description

**RupeePulse** is a personal finance management ecosystem designed for the modern Indian economy.

Unlike generic multi-tenant expense trackers, RupeePulse is architected as an ultra-fast, sovereign financial workstation. It combines native PWA offline capabilities with low-latency serverless routes co-located in Mumbai (`bom1`). The platform features a continuous bilateral friend ledger passbook for debt reconciliation, an OLED cosmic dark UI with 60 FPS HTML5 canvas starfields, a client-side SWR caching layer, an isolated 6-digit PIN vault, executive-grade PDF/Excel statement downloads, and deep financial quantitative modeling powered by Python and Go.

---

## ✨ Features

- **Cosmic Night Sky OLED Interface**: Pure deep black aesthetic (`#060608`) with dynamic 60 FPS drifting starfield canvas:
  - **Emerald-500** (`#10b981`): Inflows, Income, and Receivables ("To Take").
  - **Rose-500** (`#f43f5e`): Outflows, Expenses, and Payables ("To Give").
  - **Sky-500** (`#0ea5e9`): UPI digital transfers and QR reconciliations.
  - **Amber-500** (`#f59e0b`): Cash balances and petty cash reserves.
  - **Violet-500** (`#8b5cf6`): Credit Cards and Net Banking settlements.
- **PIN-Secured Vault**: Protected by a 6-digit numeric PIN with an enlarged touch keypad. Automatically locks on browser reload for zero-exposure privacy.
- **📑 Statement Exporter (PDF, Excel .xlsx & CSV)**:
  - Generate official PDF statements with executive summary cards, transaction movement tables, and confidential vault footers.
  - Multi-sheet Excel spreadsheets (`.xlsx`) and CSV tables with category volume breakdown, payment channel analysis, and net formulas.
  - Granular period filtering: **Complete Month**, **Week (Current / Last 7 Days)**, **Single Day**, **Full Year**, or **Custom Date Range**.
- **Zero-Latency SWR Caching & Performance**:
  - Client-side SWR cache (`lib/clientCache.ts`) providing immediate sub-millisecond tab switching.
  - Pre-warmed MongoDB Atlas connection pools (`minPoolSize: 2`, `maxIdleTimeMS: 30000`).
  - Region co-location (`vercel.json`) with Mumbai (`bom1`) matching MongoDB Atlas (`ap-south-1`).
  - Compound B-Tree indexes on `{ isSettled: 1, date: -1 }` and `{ date: -1, createdAt: -1 }`.
- **Bilateral Friend Ledger**: Replaces fragmented split calculations with a **running continuous passbook**. Payments, deposits, and split adjustments auto-calculate into a single net balance per friend with an archived audit trail.
- **Indian Numbering System (INR)**: Real-time currency formatting compliant with the Indian numbering format using `Intl.NumberFormat('en-IN')` (e.g. `₹1,50,000.00`).
- **Polyglot Quantitative Analytics**:
  - **Python Suite** (`engine/finance_engine.py`): 1,500-iteration Monte Carlo cash runway simulator, Z-score & IQR spending outlier detection, Shannon entropy score, and Indian New Tax Regime (FY 2024-25) calculator.
  - **Go CLI** (`cli/main.go`): Cryptographic SHA-256 ledger integrity verification and concurrent transaction auditors.
  - **SQL Engine** (`database/schema_and_analytics.sql`): Double-entry ledger architecture with ACID balance triggers and 30-day moving average window functions.

---

## 📂 File Structure

```text
Personal-Finance-Management/
├── .env.example                  # Environment configuration template
├── .gitignore                    # Excludes node_modules, build caches & credentials
├── Dockerfile                    # Multi-stage production container build (Alpine Linux)
├── LICENSE                       # MIT Open Source License
├── README.md                     # Technical architecture & operational manual
├── docker-compose.yml            # Docker orchestration configuration
├── middleware.ts                 # Next.js edge route protection & vault security
├── next.config.mjs               # Next.js compiler & security headers
├── package.json                  # NPM packages & build scripts
├── postcss.config.mjs            # PostCSS plugin configurations
├── tailwind.config.ts            # Custom Tailwind theme tokens & color palettes
├── tsconfig.json                 # TypeScript compiler specifications
├── vercel.json                   # Serverless function region co-location (bom1)
├── app/                          # Next.js 14 App Router
│   ├── globals.css               # Global styles & canvas rules
│   ├── layout.tsx                # Root layout with PWA manifest injection
│   ├── page.tsx                  # Primary dashboard view (2x2 mobile grid)
│   ├── ledger/                   # Bilateral Friend Ledger continuous passbook
│   ├── profile/                  # User profile, Category & Friend management
│   ├── transactions/             # Transaction tracker, search & statement export
│   └── api/                      # Parallelized RESTful API route handlers
│       ├── auth/                 # Vault login, verification & logout endpoints
│       ├── categories/           # Category CRUD & custom palettes
│       ├── dashboard/            # Aggregate balance, income & expense metrics
│       ├── dues/                 # Friend receivable/payable tracking & settlement
│       ├── friends/              # Friend contact directory
│       └── transactions/         # Transaction search, filtering & mutations
├── cli/                          # High-performance Go CLI
│   └── main.go                   # SHA-256 cryptographic audit tool
├── components/                   # UI component architecture
│   ├── DownloadStatementModal.tsx# PDF / Excel statement export modal
│   ├── EditTransactionModal.tsx  # Modal for editing existing transactions
│   ├── QuickTransactionModal.tsx # Fast transaction entry modal
│   ├── QuickDueModal.tsx         # Ledger entry modal
│   ├── SettleUpModal.tsx         # Debt settlement modal
│   ├── VaultLockScreen.tsx       # 6-digit numeric PIN lock screen
│   └── Starfield.tsx             # 60 FPS HTML5 canvas cosmic background
├── database/                     # PostgreSQL double-entry schemas & ACID triggers
├── engine/                       # Python quantitative financial engine
│   └── finance_engine.py         # Monte Carlo simulator & outlier detection
├── lib/                          # Core utilities, MongoDB pool, SWR cache & PDF/Excel exporter
│   ├── clientCache.ts            # High-performance SWR client cache
│   ├── statementExporter.ts      # PDF, Excel (.xlsx), and CSV generator
│   └── mongodb.ts                # Mongoose pool & IPv4 DNS resolution
├── models/                       # Mongoose schemas (Transaction, Friend, FriendDue, Category)
├── public/                       # PWA manifest, service workers & icons
├── scripts/                      # DevOps scripts (backups & latency benchmarks)
└── tests/                        # Automated unit tests for quantitative engines
```

---

## 🚀 Setup & Deployment

### Prerequisites
- **Node.js**: v18.17+ or v20+
- **MongoDB Atlas** cluster or local MongoDB instance (Mumbai `ap-south-1` recommended)
- **Python 3.11+** (for quantitative engine)
- **Go 1.22+** (for CLI audit tools)
- **Docker & Docker Compose** (optional for containerized deployment)

### 1. Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AnshulKanodia/Personal-Finance-Management.git
   cd Personal-Finance-Management
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env.local
   ```
   Provide your values in `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/rupeepulse?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_encryption_secret_key
   VAULT_PIN=123456
   ```

4. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to access RupeePulse.

### 2. Docker Deployment
To launch the complete application inside a production container:
```bash
docker-compose up --build -d
```

### 3. Deploying to Vercel
1. Push the repository to GitHub.
2. Import into **Vercel** and select Next.js.
3. Configure environment variables (`MONGODB_URI`, `JWT_SECRET`, `VAULT_PIN`).
4. Ensure region is set to **Mumbai (bom1)** matching `vercel.json` for optimal sub-15ms latency.

---

## 🛠️ Tech Stack & Language Breakdown

| Domain | Technologies |
|---|---|
| **Frontend & SSR** | Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, SWR |
| **Backend & API** | Node.js, Next.js Route Handlers, JWT Authentication |
| **Database** | MongoDB Atlas, Mongoose ODM, PostgreSQL 14 (Double-Entry Engine) |
| **Export Engines** | jsPDF, jspdf-autotable, SheetJS (XLSX) |
| **Quantitative Analytics** | Python 3.11+ (NumPy, SciPy, Pandas), Go 1.22+ (SHA-256 Engine) |
| **DevOps & Containers** | Docker, Docker Compose, Vercel Serverless (Region `bom1`) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.