# 💰 RupeePulse — Personal Finance Management (PWA)

[![Next.js](https://img.shields.io/badge/Framework-Next.js_14_App_Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_OLED_Dark-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas_Serverless-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![PWA](https://img.shields.io/badge/PWA-Progressive_Web_App-f68212?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Python](https://img.shields.io/badge/Engine-Python_3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![Go](https://img.shields.io/badge/CLI-Go_1.22+-00ADD8?style=flat&logo=go&logoColor=white)](https://golang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

## 📌 Small Description

**RupeePulse** is a high-performance, private personal finance management ecosystem and Progressive Web App (PWA) architected specifically for the Indian currency system (INR).

Designed as an ultra-fast sovereign financial workstation, RupeePulse pairs an OLED cosmic dark UI with client-side SWR caching, instant WebAuthn biometric unlock, an isolated 6-digit PIN vault, discreet stealth pixelation mode, real-time spending velocity tracking, a bilateral continuous friend ledger passbook, executive-grade PDF/Excel statement exports, and polyglot quantitative engines (Python & Go).

---

## ✨ Features

- 🔒 **Biometric Unlock (WebAuthn / Passkeys / Fingerprint / FaceID)**
  - Instant hardware-level biometric authentication using standard mobile device sensors without retyping the PIN on every session.
  - Seamless fallback to the 6-digit numeric PIN keypad whenever needed.

- 👁️ **Discreet / Stealth Mode (Privacy Pixelate Mask)**
  - Instant one-tap privacy toggle to mask sensitive balances, income, expenses, and cash reserves with modern pixelation obfuscation (`backdrop-blur-sm` filter).
  - Open and navigate RupeePulse comfortably in metros, cafes, or around friends with zero exposure of financial numbers.

- ⚡ **Weekly Spending Velocity Gauge**
  - Real-time spending pace comparator that evaluates current week outflow against the prior week pace.
  - Displays instant classification badges (**Faster**, **Average**, **Slower**) alongside dynamic daily burn metrics and month-end projections.

- 📱 **Home Screen App Shortcuts (Android & iOS PWA)**
  - Direct long-press native actions straight from your phone home screen:
    - ⚡ **Quick Log Expense**: Instantly opens expense entry modal.
    - 💵 **Add Income**: Fast one-tap salary and inflow logging.
    - 👥 **Friends Ledger**: Jumps directly to Khaata passbook.

- 🎨 **Customizable Dashboard Layout**
  - Reorder, hide, or display dashboard modules directly from **Profile → Customize Dashboard UI**:
    - Spending Velocity Gauge
    - Expense by Category Chart
    - Payment Channels Breakdown
    - Recent Transactions Feed
  - Simple up/down and toggle controls persisted in your local preferences.

- 👥 **Bilateral Friends Ledger ("Khaata" Passbook)**
  - Replaces messy multi-person expense splits with a **continuous running passbook**.
  - Dual ledger tracking: **"To Take"** (Receivables) vs. **"To Give"** (Payables).
  - **Settle Up** reconciliation with optional auto-logging of settlements as real income/expense transactions in the primary ledger.

- 📑 **Executive Statement Exporter (PDF, Excel .xlsx & CSV)**
  - **PDF Statements**: Professional layout with executive summary cards, transaction movement tables, and confidential vault footers.
  - **Multi-Sheet Excel (`.xlsx`)**: Structured workbooks with category breakdowns, payment mode metrics, and summary formulas.
  - **Flexible Filtering**: Export by Full Month, Week, Single Day, Full Year, or Custom Date Range.

- 🌌 **Cosmic OLED Night Sky Interface**
  - Pure `#060608` deep black theme optimized for battery saving on OLED/AMOLED mobile screens.
  - Dynamic 60 FPS HTML5 canvas starfield backdrop.
  - Indian financial color tokens:
    - 🟢 **Emerald-500** (`#10b981`): Inflows, Income, and Receivables
    - 🔴 **Rose-500** (`#f43f5e`): Outflows, Expenses, and Payables
    - 🔵 **Sky-500** (`#0ea5e9`): UPI digital transfers and QR reconciliations
    - 🟡 **Amber-500** (`#f59e0b`): Liquid cash balances and petty cash
    - 🟣 **Violet-500** (`#8b5cf6`): Credit cards and net banking settlements

- ⚡ **Zero-Latency SWR Caching & Performance**
  - Client-side SWR caching (`lib/clientCache.ts`) providing instantaneous tab transitions.
  - Serverless connection pooling with pre-warmed MongoDB Atlas connections (`minPoolSize: 2`, `maxIdleTimeMS: 30000`).
  - Region co-location configured for **Mumbai (`bom1`)** in `vercel.json` matching MongoDB Atlas `ap-south-1`.

- 🧮 **Polyglot Quantitative Analytics Suite**
  - **Python Engine** (`engine/finance_engine.py`): 1,500-iteration Monte Carlo cash runway simulator, Z-score & IQR spending outlier detection, Shannon entropy score, and Indian New Tax Regime (FY 2024-25) calculator.
  - **Go CLI** (`cli/main.go`): SHA-256 cryptographic ledger integrity auditor.
  - **SQL Engine** (`database/schema_and_analytics.sql`): Double-entry ledger architecture with ACID balance triggers and 30-day moving average window functions.

---

## 📂 File Structure

```text
Personal-Finance-Management/
├── .env.example                     # Environment configuration template
├── .gitignore                       # Strict exclusions (secrets, node_modules, caches)
├── Dockerfile                       # Production multi-stage Alpine container build
├── LICENSE                          # MIT Open Source License
├── README.md                        # Documentation & operational architecture
├── docker-compose.yml               # Containerized stack deployment
├── middleware.ts                    # Edge route protection & vault security
├── next.config.mjs                  # PWA service worker & Next.js compiler settings
├── package.json                     # NPM dependencies, scripts & metadata
├── postcss.config.mjs               # PostCSS & Tailwind configurations
├── tailwind.config.ts               # Custom OLED color tokens & animations
├── tsconfig.json                    # TypeScript compiler specifications
├── vercel.json                      # Vercel serverless region co-location (bom1)
├── app/                             # Next.js 14 App Router
│   ├── globals.css                  # OLED styling & canvas starfield rules
│   ├── layout.tsx                   # Root HTML shell & PWA manifest injector
│   ├── loading.tsx                  # Global vault suspense loader
│   ├── page.tsx                     # Main dashboard view with customizable widgets
│   ├── ledger/                      # Bilateral Friend Ledger continuous passbook
│   ├── profile/                     # Profile, statement export, friends & settings
│   ├── transactions/                # Transaction tracker, search & statement exports
│   └── api/                         # Parallelized RESTful API route handlers
│       ├── auth/                    # PIN & WebAuthn biometric authentication
│       ├── categories/              # Category CRUD & auto-seeding
│       ├── dashboard/               # Aggregate metrics & spending velocity stats
│       ├── dues/                    # Friend dues ledger operations & settlements
│       ├── friends/                 # Friend contact directory
│       ├── groups/                  # Group expense & trip split endpoints
│       └── transactions/            # Transaction filtering, mutations & exports
├── cli/                             # High-performance Go CLI
│   └── main.go                      # SHA-256 cryptographic audit tool
├── components/                      # Reusable UI component library
│   ├── AppShell.tsx                 # Root layout container & security orchestrator
│   ├── BottomNav.tsx                # Mobile-first floating navigation bar
│   ├── CategoryIcon.tsx             # Dynamic Lucide category icon renderer
│   ├── DashboardSettingsModal.tsx   # Dashboard layout & widget customizer modal
│   ├── DownloadStatementModal.tsx   # PDF / Excel / CSV statement exporter modal
│   ├── EditTransactionModal.tsx     # Transaction edit modal
│   ├── Navbar.tsx                   # Header bar with stealth toggle & vault controls
│   ├── PrivacyMask.tsx              # CSS pixelate obfuscation component
│   ├── QuickDueModal.tsx            # Khaata friend due logging modal
│   ├── QuickTransactionModal.tsx    # Fast income/expense transaction logger
│   ├── RupeeLoader.tsx              # Animated INR pulse loader
│   ├── SettleUpModal.tsx            # Debt reconciliation & settlement modal
│   ├── SpendCategoryChart.tsx       # Recharts category distribution donut chart
│   ├── SpendingVelocityCard.tsx     # Real-time spending velocity gauge card
│   ├── Starfield.tsx                # 60 FPS HTML5 canvas background
│   ├── StatCard.tsx                 # Metric cards with stealth mode integration
│   ├── TripManager.tsx              # Multi-person trip split manager
│   └── VaultLockScreen.tsx          # 6-digit numeric PIN & WebAuthn biometric unlock
├── database/                        # PostgreSQL double-entry schemas & ACID triggers
├── engine/                          # Python quantitative financial engine
│   └── finance_engine.py            # Monte Carlo simulator & outlier detection
├── lib/                             # Core utilities & service providers
│   ├── auth.ts                      # JWT session signing & PIN verification
│   ├── clientCache.ts               # Sub-millisecond SWR client-side cache
│   ├── debtSimplifier.ts            # Minimum-transfer debt settlement graph solver
│   ├── mongodb.ts                   # Mongoose connection pool & DNS resolver
│   ├── preferences.ts               # Local dashboard preferences manager
│   ├── statementExporter.ts         # jsPDF, autoTable & SheetJS (XLSX) generator
│   ├── utils.ts                     # INR currency formatter & default categories
│   └── webauthn.ts                  # WebAuthn credential registration & verification
├── models/                          # Mongoose document schemas
│   ├── Category.ts                  # Category schema with hex color & Lucide icon
│   ├── Friend.ts                    # Friend directory contact schema
│   ├── FriendDue.ts                 # Bilateral passbook entry schema
│   ├── Group.ts                     # Trip / group split schema
│   └── Transaction.ts               # Primary financial transaction schema
└── public/                          # PWA manifest, service workers & asset icons
    ├── icons/                       # High-res PWA application icons
    ├── manifest.json                # PWA manifest with shortcuts & theme colors
    └── sw.js                        # Offline service worker cache handler
```

---

## 🚀 Setup & Deployment

### Prerequisites

- **Node.js**: `v18.17+` or `v20+`
- **MongoDB**: MongoDB Atlas cluster (Mumbai `ap-south-1` recommended) or local MongoDB instance
- **Python**: `3.11+` (optional, for quantitative analytics engine)
- **Go**: `1.22+` (optional, for SHA-256 CLI auditor)
- **Docker**: Optional for containerized deployment

---

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
   Create a `.env.local` file by copying the example template:
   ```bash
   cp .env.example .env.local
   ```
   Configure your environment variables:
   ```env
   # MongoDB Atlas Connection URI
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/personal_finance?retryWrites=true&w=majority

   # 6-Digit Numeric Security PIN for Vault Access (default: 123456)
   APP_PIN=123456

   # Secret Key for Signing JWT Session Cookies (32+ characters)
   SESSION_SECRET=rupeepulse-super-secure-finance-vault-secret-key-32

   # Vault Owner Display Name (Optional, defaults to "Vault Owner")
   NEXT_PUBLIC_USER_NAME="Vault Owner"
   ```

4. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. Enter your PIN (`123456`) to unlock your personal vault. Default categories will be automatically seeded on your first launch!

---

### 2. Docker Deployment

To launch the complete application inside a production container:

```bash
docker-compose up --build -d
```

The containerized service will be available at `http://localhost:3000`.

---

### 3. Deploying to Vercel (Recommended)

1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New Project"** → Import your repository.
3. In the project **Environment Variables** settings, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `APP_PIN`: Your 6-digit numeric vault PIN (e.g. `123456`).
   - `SESSION_SECRET`: A secure 32+ character random string.
   - `NEXT_PUBLIC_USER_NAME`: (Optional) Your name or title (e.g. `"Vault Owner"`).
4. **Region Configuration**: Ensure the deployment region is set to **Mumbai, India (`bom1`)** (configured automatically via `vercel.json`) to achieve sub-15ms database response times with MongoDB Atlas `ap-south-1`.
5. Click **Deploy**. Your instance is now live!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.