# 🌌 RupeePulse — Personal Finance Management (PWA)

> A high-performance, private, single-user Personal Finance Management Progressive Web App (PWA) tailored for the Indian currency system (INR), featuring OLED blacks, twinkling cosmic night sky, friend expense splitting ("Khaata"), and a polyglot quantitative analytics suite.

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
│   ├── api/              # Auth, Dashboard metrics, Dues, Categories, Transactions
│   ├── categories/       # Category manager UI & custom hex color/icon picker
│   ├── khaata/           # Khaata: continuous passbook & single net-balance ledger
│   ├── login/            # Dedicated PIN lock screen with Starfield canvas
│   └── transactions/     # Filterable transaction history & monthly groups
├── cli/main.go           # Go CLI: SHA-256 cryptographic ledger & concurrent aggregators
├── components/           # Starfield (60fps canvas), AppShell, Modals & PIN Keypad
├── database/             # SQL double-entry ledger, ACID triggers & window funcs
├── engine/               # Python quantitative suite (Monte Carlo, Outliers, Tax slabs)
├── lib/                  # JWT auth (jose), MongoDB connection pooling, INR formatters
├── models/               # Mongoose schemas (Transaction, Friend, FriendDue, Category)
├── public/               # Manifest.json, high-res icons, PWA service worker
├── scripts/vault_ops.sh  # DevOps automation: DB snapshot backup & latency health checks
├── tests/                # Automated unit tests for quantitative engine (100% pass)
├── Dockerfile            # Multi-stage production container build (Alpine Linux)
└── docker-compose.yml    # Container orchestration configuration
```

---

## ✨ Highlights & Features

- **🌌 Cosmic Night Sky Theme**: OLED black backdrop (`#060608`) with a 60 FPS HTML5 Canvas of drifting, twinkling stars.
  - 🟢 **Emerald-500** (`#10b981`): Inflows, Income, and Receivables ("To Take")
  - 🔴 **Rose-500** (`#f43f5e`): Outflows, Expenses, and Payables ("To Give")
  - 🔵 **Sky-500** (`#0ea5e9`): UPI digital transfers
  - 🟡 **Amber-500** (`#f59e0b`): Cash reserves and payments
  - 🟣 **Violet-500** (`#8b5cf6`): Card payments
- **🔒 Auto-Locking Private Vault**: Protected by a 4-to-8 digit PIN. **Vault automatically locks immediately on every page reload or refresh** for zero-exposure privacy.
- **🇮🇳 Indian Numbering System (INR)**: Real-time formatting using `Intl.NumberFormat('en-IN')` (e.g. `₹1,50,000.00`).
- **⚡ Sub-Second Analytics**: Dashboard queries execute concurrently via `Promise.all` across MongoDB Atlas pipelines.
- **🤝 Khaata (Continuous Friend Passbook)**: Consolidates splits, loans, and deposits into **one single net running balance** per friend with quick `+ Received`, `- Spent / Lent`, and `Settle Up` actions.
- **🛠️ Polyglot Analytics**:
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
# MongoDB Atlas Connection URI (Free M0 cluster)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/personal_finance?retryWrites=true&w=majority

# Your custom PIN (4 to 8 digits)
APP_PIN=1234

# Secret for signing secure session cookies (32+ chars)
SESSION_SECRET=create-any-secure-random-32-char-string-here
```

```bash
# 4. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). Enter your PIN to unlock the vault. Standard categories are automatically auto-seeded on first launch!

---

### 2. Cloud Deployment (Vercel)

1. Push your code or fork to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Add the following **Environment Variables** in Vercel project settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `APP_PIN`: Your personal private PIN.
   - `SESSION_SECRET`: A secure 32+ character random string.
4. Click **Deploy**. Vercel will build the serverless functions and host your PWA with automatic SSL.

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