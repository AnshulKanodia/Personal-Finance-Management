# 🌌 RupeePulse — Personal Finance Management (PWA)

> A high-performance, private, single-user Personal Finance Management Progressive Web App (PWA) tailored for the Indian currency system (INR), featuring OLED blacks, twinkling cosmic night sky, friend expense splitting ("Khaata"), and a polyglot quantitative analytics suite.

[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow?logo=python)](https://python.org/)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)](https://golang.org/)
[![SQL](https://img.shields.io/badge/SQL-PostgreSQL_14+-336791?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-OLED_Dark-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Serverless-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

---

## 📂 Repository File & Directory Structure

```text
Personal-Finance-Management/
├── app/                                # Next.js 14 App Router (Pages & API Routes)
│   ├── api/                            # Backend REST & Serverless Microservices
│   │   ├── auth/                       # PIN verification, session JWT & cookie handlers
│   │   │   ├── check/route.ts          # Validates session authentication state
│   │   │   ├── login/route.ts          # Authenticates 4-digit PIN & sets HTTP-only cookie
│   │   │   └── logout/route.ts         # Clears session cookie
│   │   ├── categories/                 # Category management API
│   │   │   ├── [id]/route.ts           # Edit / delete category
│   │   │   └── route.ts                # Fetch & auto-seed default categories
│   │   ├── dashboard/                  # Core dashboard metrics API (Parallelized aggregations)
│   │   │   └── route.ts                # Promise.all aggregation: stats, trends, categories, channels
│   │   ├── dues/                       # Khaata debt & settlement APIs
│   │   │   ├── settle/route.ts         # Settle-up handler (offsets dues & records settlement)
│   │   │   └── route.ts                # Log new friend dues / deposits
│   │   ├── friends/                    # Friend contact management
│   │   │   ├── [id]/route.ts           # Update / remove friend
│   │   │   └── route.ts                # List friends with calculated net balances
│   │   └── transactions/               # Financial transactions API
│   │       ├── [id]/route.ts           # Update / delete individual transaction
│   │       └── route.ts                # Query, filter & paginate income/expenses
│   ├── categories/                     # Category manager page
│   │   └── page.tsx                    # Category grid, icon viewer & custom creation
│   ├── khaata/                         # Khaata (Friend Passbook & Continuous Ledger)
│   │   └── page.tsx                    # Single net-balance view, deposit/split adjustment & history
│   ├── login/                          # Standalone PIN unlock page
│   │   └── page.tsx                    # Touchscreen numeric keypad with Starfield background
│   ├── transactions/                   # Expense & Income ledger page
│   │   └── page.tsx                    # Searchable, filterable list with monthly groupings
│   ├── favicon.ico                     # App favicon
│   ├── globals.css                     # Tailwind OLED styling, neon glows & dot-grid patterns
│   ├── layout.tsx                      # Root layout, PWA meta headers & AppShell wrapper
│   └── page.tsx                        # Main dashboard: stat cards, donut chart, recent feed
│
├── cli/                                # High-Performance Systems & CLI Tooling
│   └── main.go                         # Go CLI: SHA-256 cryptographic ledger & concurrent aggregators
│
├── components/                         # Reusable React UI Components
│   ├── AppShell.tsx                    # Master layout wrapper: Starfield, auto-locks on refresh
│   ├── BottomNav.tsx                   # Mobile-first floating bottom navigation
│   ├── CategoryModal.tsx               # Modal to add/edit custom categories with color picker
│   ├── EditTransactionModal.tsx        # Modal to modify existing transaction details
│   ├── Navbar.tsx                      # Desktop top bar with quick-add & manual vault lock
│   ├── QuickDueModal.tsx               # Fast modal to log Khaata deposits or split expenses
│   ├── QuickTransactionModal.tsx       # Fast modal to log Income or Expense transactions
│   ├── Starfield.tsx                   # 60 FPS HTML5 Canvas cosmic drifting stars & twinkling particles
│   └── VaultLockScreen.tsx             # Touchscreen PIN lock overlay (auto-triggers on refresh)
│
├── database/                           # Relational Ledger Architecture & SQL Engines
│   └── schema_and_analytics.sql        # PostgreSQL double-entry bookkeeping, CTEs & window functions
│
├── engine/                             # Quantitative Finance & Predictive Analytics
│   └── finance_engine.py               # Python: Monte Carlo runway, Z-score anomalies, Indian Tax
│
├── lib/                                # Core Utility Libraries & Database Adapters
│   ├── auth.ts                         # JWT token generation, cryptographic signing & PIN validation
│   ├── mongodb.js                      # JavaScript MongoDB connection pooling adapter
│   ├── mongodb.ts                      # TypeScript connection pool with DNS SRV fallback for Windows
│   └── utils.ts                        # INR currency formatting (Intl.NumberFormat) & date helpers
│
├── models/                             # Mongoose Object Data Models (ODM)
│   ├── Category.ts                     # Category schema (name, color, icon, type)
│   ├── Friend.ts                       # Friend contact profile schema
│   ├── FriendDue.ts                    # Khaata bilateral ledger entry (TO_TAKE / TO_GIVE)
│   └── Transaction.ts                  # Financial transaction schema (amount, type, category, mode)
│
├── public/                             # Static Assets & PWA Configuration
│   ├── icons/                          # PWA high-res application icons (192x192, 512x512)
│   ├── manifest.json                   # Progressive Web App manifest definition
│   └── sw.js                           # Offline caching service worker (generated)
│
├── scripts/                            # DevOps, SRE & Reliability Engineering
│   └── vault_ops.sh                    # Bash automation: DB backups, 7-day retention, health check
│
├── tests/                              # Automated Unit Testing Suite
│   └── test_finance_engine.py          # Python unit tests for quant finance engine (100% pass)
│
├── .env.example                        # Template for environment variables (safe to commit)
├── .gitignore                          # Strict gitignore: shields .env.local, pycache, build files
├── docker-compose.yml                  # Docker Compose configuration for container orchestration
├── Dockerfile                          # Multi-stage production container build (Alpine Linux)
├── middleware.ts                       # Next.js Edge middleware: protects private routes from unauthorized access
├── next.config.mjs                     # Next.js PWA build pipeline configuration
├── package.json                        # Node.js dependencies, scripts & project metadata
├── postcss.config.mjs                  # PostCSS plugins configuration
├── tailwind.config.ts                  # Custom Tailwind theme: OLED `#060608` & neon accents
└── tsconfig.json                       # TypeScript strict configuration
```

---

## ✨ Key Features

1. **🌌 Cosmic Night Sky Theme**:
   - Deep OLED black background (`#060608`) overlaid with a 60 FPS HTML5 Canvas of drifting, twinkling stars.
   - Neon color-coding:
     - 🟢 **Emerald-500** (`#10b981`): Inflows, Income, and Receivables ("To Take")
     - 🔴 **Rose-500** (`#f43f5e`): Outflows, Expenses, and Payables ("To Give")
     - 🔵 **Sky-500** (`#0ea5e9`): UPI payments and digital transactions
     - 🟡 **Amber-500** (`#f59e0b`): Cash transactions and reserves
     - 🟣 **Violet-500** (`#8b5cf6`): Card payments

2. **🔒 Single-User PIN Vault (Auto-Lock on Refresh)**:
   - Protected by a 4-to-8 digit PIN stored only in your private `.env.local` / Vercel secrets.
   - Touchscreen numeric keypad and hardware keyboard support.
   - **Vault auto-locks immediately on browser reload or page refresh** for maximum privacy.
   - Sets a secure, HTTP-only, 30-day session cookie signed with HS256 (`jose`).

3. **🇮🇳 Indian Numbering System (INR)**:
   - Native support for Indian Rupee notation (e.g. `₹1,50,000.00` using `Intl.NumberFormat('en-IN')`).

4. **⚡ Sub-Second Analytics**:
   - Dashboard aggregations are parallelized via `Promise.all` across MongoDB Atlas pipelines, cutting network latency from 2–3s down to sub-second.

5. **🤝 Khaata (Continuous Friend Passbook)**:
   - Consolidates bilateral loans, splits, and deposits into **one unified net running balance**.
   - Real-time action buttons: `+ Received` (decreases debt), `- Spent / Lent` (increases debt), and `Settle Up`.

6. **🛠️ Polyglot Architecture (CV Booster)**:
   - **Python** (`engine/finance_engine.py`): 1,500-trial Monte Carlo cash runway simulations, Z-Score & IQR anomaly detection, Shannon spending entropy, and Indian New Tax Regime (FY 2024-25) estimators.
   - **SQL** (`database/schema_and_analytics.sql`): Double-entry ledger with debit/credit balance triggers, recursive CTE hierarchy trees, and 30-day moving average window functions.
   - **Go** (`cli/main.go`): Cryptographic SHA-256 hash-chain ledger auditor and concurrent spend aggregators.
   - **Shell & DevOps** (`scripts/vault_ops.sh`, `Dockerfile`): Automated MongoDB backup snapshots, retention rotation, and health checks.

---

## 🚀 Can Anyone Use This? (Getting Started)

**Yes, absolutely!** Anyone can fork or clone this repository and run their own private finance vault by simply supplying their own environment keys.

### Step 1: Clone the Repository
```bash
git clone https://github.com/AnshulKanodia/Personal-Finance-Management.git
cd Personal-Finance-Management
npm install
```

### Step 2: Configure Your Environment Keys
Create a `.env.local` file in the root of the project:
```bash
cp .env.example .env.local
```

Open `.env.local` and set your credentials:
```env
# 1. Your MongoDB Atlas connection string (Free M0 cluster works great)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/personal_finance?retryWrites=true&w=majority

# 2. Your personal private PIN code (4 to 8 digits)
APP_PIN=1234

# 3. Random 32+ character key for signing session tokens
SESSION_SECRET=create-any-secure-random-32-char-string-here
```

### Step 3: Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Enter your PIN to unlock the vault. Standard categories (`Water`, `Snacks`, `Food & Dining`, `Groceries`, `Salary`, etc.) will be seeded automatically on first visit!

---

## ☁️ 1-Click Deployment to Vercel

1. Push your fork to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"** -> import this repository.
3. In **Settings -> Environment Variables**, add:
   - `MONGODB_URI` = Your MongoDB Atlas connection URI
   - `APP_PIN` = Your private PIN
   - `SESSION_SECRET` = Your random 32+ character secret
4. Click **Deploy**. Your PWA is live with automatic SSL, edge caching, and serverless scaling.

---

## 🛡️ Security FAQ: Making This Repo Public

### ❓ "If I make this repository public, will my MongoDB database or credentials leak?"
**No, your database and credentials will NOT leak.** Here is why:

1. **`.env.local` is completely excluded from Git**:
   - The `.gitignore` file explicitly lists `.env`, `.env*.local`, and `.env.local`.
   - Git ignores these files entirely; they exist **only on your local computer**.
   - Your actual MongoDB connection string, password, and session secret have **never been committed to Git history**.

2. **Only `.env.example` is Public**:
   - The repository only tracks `.env.example`, which contains fake placeholder strings (`<username>:<password>`).

3. **Database Access is Isolated**:
   - Anyone who clones your public repo must provide **their own** MongoDB database URI in their local `.env.local`. They cannot access your database.

### 🔒 Best Practices for Maximum Security
- **Keep `.env.local` in `.gitignore`**: Never remove `.env*.local` from `.gitignore`.
- **MongoDB Atlas IP Access**: In MongoDB Atlas -> *Network Access*, you can restrict access or set it to `0.0.0.0/0` (required for Vercel dynamic serverless IPs) protected with a strong, random password.
- **Instant Password Rotation**: If you ever accidentally paste a connection string anywhere, simply go to MongoDB Atlas -> *Database Access* -> *Edit User* -> *Edit Password*, and your old credentials become instantly invalid.
- **GitHub Secret Scanning**: GitHub automatically scans all public repositories for leaked MongoDB, AWS, and API tokens and immediately warns you if a secret is accidentally committed.

---

## 🧪 Testing & Diagnostics

### Run Python Quantitative Suite & Unit Tests:
```bash
# Run full algorithmic audit
python engine/finance_engine.py --audit

# Run unit tests (7 tests covering Monte Carlo, Tax slabs, and Anomaly detection)
python -m unittest tests/test_finance_engine.py
```

### Run Go Cryptographic Ledger Auditor:
```bash
go run cli/main.go --audit --verify
```

### Run DevOps Backup & Health Check:
```bash
bash scripts/vault_ops.sh health http://localhost:3000
bash scripts/vault_ops.sh backup
```

---

## 📄 License

MIT License. Designed and maintained for private personal wealth management.