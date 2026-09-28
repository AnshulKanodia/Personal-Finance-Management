# 🌌 RupeePulse — Personal Finance Management (PWA)

> A high-performance, private, single-user Personal Finance Management Progressive Web App (PWA) tailored for the Indian currency system (INR), featuring OLED blacks, an interactive cosmic starfield sky, bilateral friend ledger passbooks, zero-latency SWR caching, and a polyglot quantitative analytics suite.

[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow?logo=python)](https://python.org/)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)](https://golang.org/)
[![SQL](https://img.shields.io/badge/SQL-PostgreSQL_14+-336791?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-OLED_Dark-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Serverless-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

## 📂 Project Architecture

```text
Personal-Finance-Management/
├── app/                  # Next.js 14 App Router (Pages & Parallelized REST APIs)
│   ├── api/              # Auth, Dashboard, Dues, Friends, Categories, Transactions
│   ├── ledger/           # Bilateral Friend Ledger: continuous passbook & net balance
│   ├── profile/          # User profile, Category Manager & Friend Management
│   ├── transactions/     # Filterable transaction history, search & edit modal
│   └── login/            # Dedicated 6-digit PIN vault lock screen with Starfield
├── cli/main.go           # Go CLI: SHA-256 cryptographic ledger & concurrent auditors
├── components/           # Starfield (60fps canvas), Modals, Keypad & Navigation
├── database/             # SQL double-entry ledger, ACID triggers & window funcs
├── engine/               # Python quantitative suite (Monte Carlo, Outliers, Tax slabs)
├── lib/                  # SWR client cache, MongoDB pool, JWT auth, INR formatters
├── models/               # Mongoose schemas (Transaction, Friend, FriendDue, Category)
├── public/               # Manifest.json, high-res icons, PWA service worker
├── scripts/vault_ops.sh  # DevOps automation: DB snapshot backup & latency health checks
├── tests/                # Automated unit tests for quantitative engine (100% pass)
├── vercel.json           # Serverless function region co-location (bom1 / Mumbai)
├── Dockerfile            # Multi-stage production container build (Alpine Linux)
└── docker-compose.yml    # Container orchestration configuration
```

---

## ✨ Highlights & Features

- **🌌 Cosmic Night Sky Theme**: OLED deep black backdrop (`#060608`) with a 60 FPS HTML5 Canvas of drifting, twinkling stars.
  - 🟢 **Emerald-500** (`#10b981`): Inflows, Income, and Receivables ("To Take")
  - 🔴 **Rose-500** (`#f43f5e`): Outflows, Expenses, and Payables ("To Give")
  - 🔵 **Sky-500** (`#0ea5e9`): UPI digital transfers
  - 🟡 **Amber-500** (`#f59e0b`): Cash reserves and payments
  - 🟣 **Violet-500** (`#8b5cf6`): Card / Net Banking payments
- **🔒 Auto-Locking Private Vault**: Protected by a 6-digit numeric PIN with an enlarged, touch-friendly 56px+ mobile keypad. **Vault automatically locks immediately on page reload** for zero-exposure privacy.
- **⚡ Instant 0ms SWR Caching & Sub-Second Sync**:
  - **Client-Side SWR Cache** (`lib/clientCache.ts`): Immediate zero-wait page rendering on tab transitions with silent background revalidation.
  - **IPv4 DNS Optimization**: Eliminates Node.js IPv6 timeout stalls when querying MongoDB Atlas cloud clusters.
  - **Pre-warmed Connection Pool**: Maintained warm sockets (`minPoolSize: 2`, `maxIdleTimeMS: 30000`) to eliminate cold TLS handshakes.
  - **Region Co-location** (`vercel.json`): Serverless functions co-located in Mumbai (`bom1`) matching MongoDB Atlas (`ap-south-1`) for sub-15ms database latency.
  - **Compound B-Tree Indexes**: Optimized indexes on `{ isSettled: 1, date: -1 }` and `{ date: -1, createdAt: -1 }`.
- **🤝 Bilateral Friend Ledger**: Replaces rigid per-transaction settlements with a **running continuous passbook**. Payments, deposits, and split adjustments auto-calculate into a single net balance per friend with an archived audit history for settled records.
- **✏️ Editable Transactions**: Edit existing transactions and dues directly from the interface with real-time passbook and chart updates.
- **📱 Mobile-First Ergonomics**:
  - Compact 2x2 grid layout for financial overview metrics on mobile screens.
  - Clean top header (redundant buttons hidden on mobile with quick lock on top right).
  - Floating bottom navigation dock for thumb-reach ergonomics.
- **👤 Profile & Management Suite**:
  - Customizable user profile details with storage and version metadata.
  - Alphabetically sorted Category Manager with custom hex color & icon pickers.
  - Friend Manager to add, inspect, or manage bilateral ledger contacts.
- **🇮🇳 Indian Numbering System (INR)**: Real-time currency formatting using `Intl.NumberFormat('en-IN')` (e.g. `₹1,50,000.00`).
- **🛠️ Polyglot Quantitative Suite**:
  - **Python** (`engine/finance_engine.py`): 1,500-iteration Monte Carlo cash runway simulator, Z-score & IQR spending outlier detection, Shannon entropy score, and Indian New Tax Regime (FY 2024-25) calculator.
  - **SQL** (`database/schema_and_analytics.sql`): Double-entry ledger architecture with ACID balance triggers, recursive CTE hierarchy trees, and 30-day moving average window functions.
  - **Go** (`cli/main.go`): Cryptographic SHA-256 hash-chain ledger verification.

---

## ⚙️ Setup & Deployment

Anyone can run their own private instance by connecting their own database and keys.

### 1. Local Development

```bash
# 1. Clone the repository
git clone https://github.com/AnshulKanodia/Personal-Finance-Management.git
cd Personal-Finance-Management

# 2. Install dependencies
npm install

# 3. Create your environment configuration
cp .env.example .env.local
```

Configure `.env.local` with your credentials:
```env
# MongoDB Atlas Connection URI (Free M0 cluster recommended in ap-south-1 Mumbai)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/personal_finance?retryWrites=true&w=majority

# Your 6-digit vault PIN
APP_PIN=123456

# Secret for signing secure session cookies (32+ chars)
SESSION_SECRET=create-any-secure-random-32-char-string-here
```

```bash
# 4. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). Enter your PIN (`123456`) to unlock the vault. Standard categories are automatically auto-seeded on first launch!

---

### 2. Cloud Deployment (Vercel)

1. Push or fork the repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add the following **Environment Variables** in Vercel settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `APP_PIN`: Your 6-digit vault PIN.
   - `SESSION_SECRET`: A secure 32+ character random string.
4. **Function Region Optimization**:
   - The repository automatically routes serverless functions to **Mumbai (`bom1`)** via `vercel.json`.
   - Ensure your MongoDB Atlas cluster is also hosted in **AWS / Mumbai (`ap-south-1`)** for maximum query speed (< 15ms).
5. Click **Deploy**. Vercel will build and host your PWA with automatic SSL and edge caching.

---

### 3. Container Deployment (Docker)

```bash
# Build and run with Docker Compose
docker-compose up -d --build
```

---

## 🧪 Testing & Verification

```bash
# Run Python quantitative diagnostics & Monte Carlo audit
python engine/finance_engine.py --audit

# Run unit tests (100% pass)
python -m unittest tests/test_finance_engine.py

# Run Go cryptographic ledger auditor
go run cli/main.go --audit --verify

# Run DevOps health check
bash scripts/vault_ops.sh health http://localhost:3000
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.