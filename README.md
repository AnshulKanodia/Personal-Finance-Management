# RupeePulse - Personal Finance Management (PWA)

A private, single-user Personal Finance Management Progressive Web App (PWA) tailored specifically for the Indian currency system (INR), featuring OLED blacks, neon accents, and friend expense splitting ("Khaata").

Designed for deployment on **Vercel** with a **MongoDB Atlas** backend.

---

## ✨ Features

- **Strict OLED Dark Mode**: Deep `#09090b` OLED blacks, slate gray borders (`#27272a`), with neon accents:
  - 🟢 **Emerald-500** (`#10b981`): Inflows, Income, and Receivables ("To Take")
  - 🔴 **Rose-500** (`#f43f5e`): Outflows, Expenses, and Payables ("To Give")
  - 🔵 **Sky-500** (`#0ea5e9`): UPI payments and transfers
  - 🟡 **Amber-500** (`#f59e0b`): Cash reserves and payments
  - 🟣 **Violet-500** (`#8b5cf6`): Card payments
- **Indian Numbering System (INR)**: All values formatted via `Intl.NumberFormat('en-IN')` (e.g. `₹1,50,000`).
- **Dashboard Overview**:
  - Top 4 stat cards: Monthly Spend Outflow, Liquid Cash Balance, Net Owed to Me, Net I Owe.
  - Interactive Recharts Donut Chart showing spend by category.
  - Payment channels breakdown (UPI vs Cash vs Card).
  - Recent transactions list with instant filter links.
- **Expense Tracker**:
  - Fast logging of amount, type (Income/Expense), payment mode (UPI, Cash, Card, Net Banking), category, and notes.
  - Search notes, filter by type, category, payment mode, or month.
  - Live summary of period inflow, outflow, and net savings.
- **"Khaata" (Friend Ledger)**:
  - Two distinct columns: **"To Take"** (money friends owe me) and **"To Give"** (money I owe others).
  - Expandable history for each friend showing specific split dues.
  - **Settle Up** button: Zeroes out balance and optionally auto-logs the settlement as an Income/Expense transaction in the main tracker!
- **Category Manager**:
  - Create and edit custom categories with hex color picker and Lucide React icons.
  - Automatic seeding of standard categories (Groceries, Food & Dining, Rent & Bills, Shopping, Travel & Fuel, Investments, Salary, Freelance, Health, Entertainment, UPI Transfers).
- **Single-User PIN Protection**:
  - Hardcoded PIN authentication with numeric touchscreen keypad.
  - Sets secure HTTP-only cookie with 30-day session.
  - Configurable PIN in `.env` (default: `1234`).
- **Progressive Web App (PWA)**:
  - Installable on iOS, Android, macOS, and Windows.
  - Standalone fullscreen experience with mobile-optimized bottom navigation.
- **Serverless Connection Pooling**:
  - MongoDB connection pooling via `lib/mongodb.js` caching connections on `global.mongoose` across Vercel Lambda invocations.
- **Polyglot Financial Engineering Suite**:
  - 🐍 **Python (`engine/finance_engine.py`)**: Quantitative analytics suite featuring Monte Carlo cash runway modeling, Z-score/IQR transaction anomaly detection, Shannon spending entropy, and Indian Tax (FY 2024-25) calculators.
  - 🔷 **Go (`cli/main.go`)**: Cryptographic SHA-256 tamper-evident ledger auditor and concurrent spend aggregators.
  - 🐘 **SQL (`database/schema_and_analytics.sql`)**: Double-entry bookkeeping schema with ACID debit/credit integrity triggers, recursive CTE hierarchy trees, and moving average window functions.
  - ⚡ **Shell & DevOps (`scripts/vault_ops.sh`, `Dockerfile`)**: Automated database snapshots, health check benchmarks, and multi-stage container deployment.

---

## 🛠️ Tech Stack & Polyglot Architecture

- **Full-Stack Web**: Next.js 14 (App Router), React 18, Tailwind CSS (OLED Dark Mode)
- **Quantitative Analytics**: Python 3 (NumPy/Pandas patterns, Monte Carlo, Statistical Outliers)
- **High-Performance CLI**: Go (Golang) for cryptographic verification & concurrency
- **Relational Ledger**: SQL (PostgreSQL / Supabase compatible Double-Entry Bookkeeping)
- **NoSQL & Cache**: MongoDB Atlas with Mongoose ORM & SRV failover
- **DevOps & Infrastructure**: Docker, Docker Compose, Bash SRE automation
- **Mobile / PWA**: `@ducanh2912/next-pwa` with custom Service Worker

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/AnshulKanodia/Personal-Finance-Management.git
cd Personal-Finance-Management
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/personal_finance?retryWrites=true&w=majority

# Security PIN for access (default: 1234)
APP_PIN=1234

# Secret for signing session cookies
SESSION_SECRET=your-random-secret-key-32-characters-minimum
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Enter your PIN (default `1234`) to unlock the vault.

---

## ☁️ Deployment on Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add the following Environment Variables in Vercel project settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `APP_PIN`: Your personal private PIN.
   - `SESSION_SECRET`: A secure 32+ character random string.
4. Deploy! Next.js will automatically configure edge and serverless functions with connection pooling.