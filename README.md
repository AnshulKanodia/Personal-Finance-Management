# 💰 RupeePulse — Personal Finance Management (PWA)

[![Release](https://img.shields.io/badge/Release-v1.5.0-emerald.svg?style=flat&logo=github)](https://github.com/AnshulKanodia/Personal-Finance-Management/releases/tag/v1.5.0)
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

Designed as an ultra-fast sovereign financial workstation, RupeePulse pairs an OLED cosmic dark UI with client-side SWR caching, instant WebAuthn biometric unlock, an isolated 6-digit PIN vault, discreet stealth pixelation mode, real-time spending velocity tracking, a bilateral continuous friend ledger passbook, executive-grade PDF/Excel statement exports, offline IndexedDB resilience, and polyglot quantitative engines (Python & Go).

---

## ✨ Features (v1.5.0)

### 🛡️ 1. Vault Guard: Category Budget Engine (`/categories`)
- **Monthly Caps & Alert Thresholds**: Set explicit spending limits per category with customizable warning thresholds (e.g. 80%).
- **Visual Progress & State Badges**: Color-coded progress bars (🟢 *Safe* $\rightarrow$ 🟡 *Warning* $\rightarrow$ 🔴 *Over Budget*) with exact headroom and overspend figures.
- **Daily Burn Rate Runway & Pacing**: Real-time spending pacing classification (*Disciplined*, *On Track*, *Pacing Hot*, *Cap Breached*) calculating recommended daily spend based on remaining days in the month.
- **Monthly Rollover Surplus**: Automatically carries forward unspent budget surplus to the following month to reward fiscal discipline.
- **Unallocated Budget Headroom**: Evaluates unallocated monthly income as an automated savings reserve.
- **Real-Time Transaction Interceptor**: Interactive live headroom preview bar inside transaction entry modals warning users before logging spend that would breach budget caps.

### 👥 2. Khaata / Split Ledger 2.0 (`/ledger`)
- **Continuous Running Passbook**: Replaces messy multi-person expense splits with a bilateral passbook for receivables (**"To Take"**) and payables (**"To Give"**).
- **Partial Due Settlement**: Clear any partial amount (with quick chips: 25%, 50%, 75%, ₹500, ₹1000) with automatic offsetting due entries and optional Income/Expense sync.
- **Dynamic UPI QR Code Generator**: Generates live NPCI-compliant UPI QR codes and payment intent deep links matching the exact settlement amount.
- **1-Tap WhatsApp Statement Share**: Generates clean bilateral split balance summaries sent directly via native `whatsapp://send` on mobile and `api.whatsapp.com` on desktop, preserving UTF-8 emojis.
- **Edit Friend Details**: In-app modal to update contact names, WhatsApp phone numbers, UPI IDs, and context tags, alongside a dedicated **All Settled Contacts** section.

### ⚡ 3. Quick Add 2.0 & Recurring Subscriptions Engine (`/transactions`)
- **Floating Action Speed Dial**: Expandable multi-action dial for rapid 1-tap logging of Expenses, Income, Dues, and Subscriptions from anywhere in the app.
- **Smart Merchant Predictor**: Auto-detects transaction categories based on merchant names (e.g. *Swiggy* $\rightarrow$ Food, *Uber* $\rightarrow$ Transport, *Blinkit* $\rightarrow$ Groceries, *Netflix* $\rightarrow$ Entertainment).
- **Recurring Commitments Manager**: Track monthly, quarterly, and yearly subscriptions with due-date rollover, reminders, and 1-tap payment logging.
- **Zero Input Latency**: Built with native uncontrolled inputs and `FormData` on form submission, delivering **0 React re-renders on keystroke** and 0ms typing lag.

### 📶 4. PWA & Offline Resilience
- **IndexedDB Persistent Offline Queue**: Queue transactions and dues when network connection is lost.
- **Automatic Background Sync**: Automatically drains and synchronizes queued offline actions in strict FIFO order upon network reconnection.
- **Service Worker Caching**: PWA assets, shell, and client-side caches stored locally for instant app startup.

### 💾 5. Sovereign Backup & Restore (`/profile`)
- **Full Vault Data Backup (`GET /api/backup`)**: One-click download of an offline JSON snapshot containing all transactions, categories, friends, and dues.
- **Interactive Restore Modal (`POST /api/restore`)**: Drag-and-drop backup inspection, count preview, safe non-destructive merge, and clean replace with confirmation safeguard.

### 🔒 6. Vault Security & Privacy
- **Biometric Unlock (WebAuthn / Passkeys / Fingerprint / FaceID)**: Hardware-level biometric authentication without typing the PIN on every session, with fallback to the 6-digit PIN.
- **Discreet / Stealth Mode (Privacy Pixelate Mask)**: Instant one-tap privacy toggle to mask sensitive balances, income, expenses, and cash reserves with modern pixelation obfuscation (`backdrop-blur-sm` filter).
- **Inactivity Auto-Lock**: Automatically locks the vault after 5 minutes of inactivity or tab switching.

### 📑 7. Executive Statement Exporter (PDF, Excel .xlsx & CSV)
- **PDF Statements**: Bank-grade layout with executive summary cards, transaction movement tables, confidential vault footers, and smart emoji transliteration.
- **Multi-Sheet Excel (`.xlsx`)**: Structured workbooks with category breakdowns, payment mode metrics, and summary formulas with full UTF-8 emoji support.
- **Flexible Filtering**: Export by Full Month, Week, Single Day, Full Year, or Custom Date Range across transactions or individual friends.

### 🌌 8. Cosmic OLED Night Sky Interface
- Pure `#060608` deep black theme optimized for battery saving on OLED/AMOLED mobile screens.
- Dynamic 60 FPS HTML5 canvas starfield backdrop.
- Indian financial color tokens:
  - 🟢 **Emerald-500** (`#10b981`): Inflows, Income, and Receivables
  - 🔴 **Rose-500** (`#f43f5e`): Outflows, Expenses, and Payables
  - 🔵 **Sky-500** (`#0ea5e9`): UPI digital transfers and QR reconciliations
  - 🟡 **Amber-500** (`#f59e0b`): Liquid cash balances and petty cash
  - 🟣 **Violet-500** (`#8b5cf6`): Credit cards and net banking settlements

### 🧮 9. Polyglot Quantitative Analytics Suite
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
├── package.json                     # NPM dependencies, scripts & metadata (v1.5.0)
├── postcss.config.mjs               # PostCSS & Tailwind configurations
├── tailwind.config.ts               # Custom OLED color tokens & animations
├── tsconfig.json                    # TypeScript compiler specifications
├── vercel.json                      # Vercel serverless region co-location (bom1)
├── app/                             # Next.js 14 App Router
│   ├── globals.css                  # OLED styling & canvas starfield rules
│   ├── layout.tsx                   # Root HTML shell & PWA manifest injector
│   ├── loading.tsx                  # Global vault suspense loader
│   ├── page.tsx                     # Main dashboard view with speed dial & widgets
│   ├── categories/                  # Vault Guard Budget Manager & category editor
│   ├── khaata/                      # Legacy redirect to /ledger
│   ├── ledger/                      # Bilateral Friend Ledger continuous passbook
│   ├── profile/                     # Profile, statement export, friends & settings
│   ├── transactions/                # Transaction tracker, subscriptions & search
│   └── api/                         # Parallelized RESTful API route handlers
│       ├── auth/                    # PIN & WebAuthn biometric authentication
│       ├── backup/                  # Full offline JSON backup snapshot generator
│       ├── budgets/                 # Vault Guard budget limits, rollover & burn rate
│       ├── categories/              # Category CRUD & auto-seeding
│       ├── dashboard/               # Aggregate metrics & spending velocity stats
│       ├── dues/                    # Friend dues ledger operations & settlements
│       ├── friends/                 # Friend contact directory & CRUD
│       ├── groups/                  # Group expense & trip split endpoints
│       ├── restore/                 # Vault data restore with merge & replace modes
│       ├── subscriptions/           # Recurring subscription commitments CRUD & payment
│       └── transactions/            # Transaction filtering, mutations & exports
├── cli/                             # High-performance Go CLI
│   └── main.go                      # SHA-256 cryptographic audit tool
├── components/                      # Reusable UI component library
│   ├── AddSubscriptionModal.tsx     # Zero-latency recurring subscription modal
│   ├── AppShell.tsx                 # Root layout container & security orchestrator
│   ├── BottomNav.tsx                # Mobile-first floating navigation bar
│   ├── BudgetImpactPreview.tsx      # Real-time transaction interceptor preview bar
│   ├── BudgetManagerCard.tsx        # Vault Guard budget management interface
│   ├── CategoryIcon.tsx             # Dynamic Lucide category icon renderer
│   ├── DashboardSettingsModal.tsx   # Dashboard layout & widget customizer modal
│   ├── DownloadStatementModal.tsx   # PDF / Excel / CSV statement exporter modal
│   ├── EditDueModal.tsx             # Friend due passbook item edit modal
│   ├── EditFriendModal.tsx          # Edit friend name, phone, UPI ID & notes modal
│   ├── EditTransactionModal.tsx     # Transaction edit modal with budget preview
│   ├── Navbar.tsx                   # Header bar with stealth toggle & brand emblem
│   ├── PrivacyMask.tsx              # CSS pixelate obfuscation component
│   ├── QuickDueModal.tsx            # Khaata friend due logging modal
│   ├── QuickTransactionModal.tsx    # Fast income/expense transaction logger
│   ├── RupeeLoader.tsx              # Animated INR pulse loader
│   ├── SettleUpModal.tsx            # Partial & full settlement modal with dynamic UPI QR
│   ├── SpendCategoryChart.tsx       # Recharts category distribution donut chart
│   ├── SpendingVelocityCard.tsx     # Real-time spending velocity gauge card
│   ├── Starfield.tsx                # 60 FPS HTML5 canvas background
│   ├── StatCard.tsx                 # Metric cards with stealth mode integration
│   ├── SubscriptionTrackerCard.tsx  # Active subscriptions & cycle overview card
│   ├── TripManager.tsx              # Multi-person trip split manager
│   ├── VaultLockScreen.tsx          # 6-digit numeric PIN & WebAuthn biometric unlock
│   ├── VaultRestoreModal.tsx        # Sovereign backup inspection & restore modal
│   └── WhatsAppShareModal.tsx       # 1-tap WhatsApp split balance share modal
├── database/                        # PostgreSQL double-entry schemas & ACID triggers
├── engine/                          # Python quantitative financial engine
│   └── finance_engine.py            # Monte Carlo simulator & outlier detection
├── hooks/                           # Custom React hooks
│   └── useBudgets.ts                # Vault Guard state management & SWR mutation hook
├── lib/                             # Core utilities & service providers
│   ├── auth.ts                      # JWT session signing & PIN verification
│   ├── clientCache.ts               # Sub-millisecond SWR client-side cache
│   ├── debtSimplifier.ts            # Minimum-transfer debt settlement graph solver
│   ├── merchantPredictor.ts         # Smart Indian merchant category auto-detector
│   ├── mongodb.ts                   # Mongoose connection pool & DNS resolver
│   ├── offlineQueue.ts              # IndexedDB offline mutation store & sync engine
│   ├── preferences.ts               # Local dashboard preferences manager
│   ├── statementExporter.ts         # jsPDF, autoTable & SheetJS (XLSX) generator
│   ├── subscriptionEngine.ts        # Due dates, cycle advancement & reminder math
│   ├── utils.ts                     # INR currency formatter & default categories
│   ├── webauthn.ts                  # WebAuthn credential registration & verification
│   └── whatsappLedger.ts            # WhatsApp message formatters & UPI intent builders
├── models/                          # Mongoose document schemas
│   ├── Budget.ts                    # Category budget caps & rollover schema
│   ├── Category.ts                  # Category schema with hex color & Lucide icon
│   ├── Friend.ts                    # Friend contact directory schema (with UPI ID)
│   ├── FriendDue.ts                 # Bilateral passbook entry schema
│   ├── Group.ts                     # Trip / group split schema
│   ├── Subscription.ts              # Recurring subscription commitment schema
│   └── Transaction.ts               # Primary financial transaction schema
├── public/                          # PWA manifest, service workers & asset icons
│   ├── icons/                       # High-res PWA application icons & wallet emblem
│   ├── manifest.json                # PWA manifest with shortcuts & theme colors
│   └── sw.js                        # Offline service worker cache handler
└── tests/                           # Automated test suites (64 tests)
    ├── benchmark.js                 # Database query performance benchmarks
    ├── test-backup-restore.js       # Backup schema & validation tests
    ├── test-budget-engine.js        # Vault Guard budget calculation test suite
    ├── test-budget-ui-logic.js      # Progress bars & metric calculation tests
    ├── test-burn-rate-math.js       # Daily burn rate runway & pacing math tests
    ├── test-edit-friend.js          # Edit friend details & validation tests
    ├── test-merchant-predictor.js   # Merchant categorization accuracy tests
    ├── test-offline-queue.js        # IndexedDB FIFO queue & synchronization tests
    ├── test-partial-due-settle.js   # Partial due settlements & balancing entries
    ├── test-rollover-and-headroom.js# Rollover surplus carryover & headroom tests
    ├── test-subscription-engine.js  # Subscription due dates & rollover cycle tests
    ├── test-transaction-interceptor.js# Real-time transaction interceptor tests
    ├── test-whatsapp-ledger-share.js# WhatsApp message & UPI deep-link tests
    └── test_finance_engine.py       # Python quantitative analytics unit tests
```

---

## 🧪 Automated Testing

RupeePulse is covered by **64 automated unit tests** across all calculation engines:

```bash
# Run all test suites
Get-ChildItem tests\test-*.js | ForEach-Object { node $_.FullName }
```

| Test Suite | Coverage |
| :--- | :--- |
| `test-budget-engine.js` | Budget caps, warning thresholds, overspend amounts |
| `test-budget-ui-logic.js` | Progress bar clamping, health aggregates |
| `test-burn-rate-math.js` | Daily burn rate runway, pacing badges |
| `test-rollover-and-headroom.js` | Rollover surplus carryover, unallocated headroom |
| `test-transaction-interceptor.js` | Real-time budget delta preview in Create/Edit modes |
| `test-partial-due-settle.js` | Partial settlement calculations & balancing entries |
| `test-whatsapp-ledger-share.js` | WhatsApp text formatting & NPCI UPI intent URLs |
| `test-merchant-predictor.js` | Indian merchant categorization accuracy |
| `test-subscription-engine.js` | Due date clamping, cycle rollover & reminders |
| `test-offline-queue.js` | IndexedDB FIFO queueing & background synchronization |
| `test-edit-friend.js` | Friend detail validation, UPI ID handling & preservation |
| `test-backup-restore.js` | Backup JSON schema validation & restore safety |

---

## 🚀 Setup & Deployment

### Prerequisites

- **Node.js**: `v18.17+` or `v20+` (tested on Node v24.18)
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
