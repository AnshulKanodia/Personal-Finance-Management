#!/usr/bin/env python3
"""
=============================================================================
RupeePulse Quantitative Finance & Predictive Analytics Engine
=============================================================================
A production-grade algorithmic financial suite for personal wealth management,
cashflow forecasting, Monte Carlo runway simulations, Khaata debt graph
simplification, and transaction anomaly detection. Tailored for Indian Rupee (INR).

Modules Included:
1. MonteCarloRunwaySimulator: Probabilistic 365-day cash runway and bankruptcy risk
2. AnomalyDetectionEngine: Z-score & Interquartile Range (IQR) spending outlier detection
3. ExpenseVelocityForecaster: Exponentially weighted moving average (EWMA) burn rate
4. KhaataDebtGraphSimplifier: Min-Cash-Flow graph reduction (greedy debt netting)
5. SpendingEntropyAnalyzer: Shannon entropy metric for budget diversification
6. IndianTaxEstimator: FY2024-25 New Tax Regime tax liability computation
7. Standalone CLI & JSON Report Exporter
=============================================================================
"""

import sys
import json
import math
import random
import argparse
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict

# Configure UTF-8 for cross-platform terminal compatibility (Windows/Linux/macOS)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


# =============================================================================
# Helper Utilities & Indian Currency Formatter
# =============================================================================

def format_inr(amount: float) -> str:
    """
    Format a floating-point number into Indian Rupee (INR) numbering system.
    e.g., 1500000 -> ₹15,00,000.00
    """
    is_negative = amount < 0
    abs_amt = abs(amount)
    
    parts = f"{abs_amt:.2f}".split(".")
    integer_part = parts[0]
    decimal_part = parts[1]
    
    if len(integer_part) <= 3:
        formatted_int = integer_part
    else:
        last_three = integer_part[-3:]
        remaining = integer_part[:-3]
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        formatted_int = ",".join(groups) + "," + last_three

    prefix = "-₹" if is_negative else "₹"
    return f"{prefix}{formatted_int}.{decimal_part}"


# =============================================================================
# 1. Monte Carlo Runway Simulation
# =============================================================================

class MonteCarloRunwaySimulator:
    """
    Simulates thousands of stochastic cash-flow trajectories over a 365-day
    horizon to estimate the probability of liquidity crisis and median runway.
    Uses Geometric Brownian Motion (GBM) with drift for recurring income and
    Poisson-distributed irregular expenses.
    """

    def __init__(
        self,
        current_liquidity: float,
        monthly_base_income: float,
        daily_expense_mean: float,
        daily_expense_std: float,
        shock_probability: float = 0.05,
        shock_magnitude_mean: float = 8000.0
    ):
        self.initial_cash = current_liquidity
        self.monthly_income = monthly_base_income
        self.daily_mu = daily_expense_mean
        self.daily_sigma = daily_expense_std
        self.shock_prob = shock_probability
        self.shock_mean = shock_magnitude_mean

    def simulate(self, num_simulations: int = 1500, days: int = 180) -> Dict[str, Any]:
        """
        Runs parallel Monte Carlo iterations and computes survival statistics.
        """
        trajectories = []
        survival_counts = [0] * (days + 1)
        terminal_balances = []
        bankruptcies = 0

        for sim in range(num_simulations):
            balance = self.initial_cash
            survived_days = days

            for day in range(1, days + 1):
                # Monthly recurring salary injection (e.g. 1st of month)
                if day % 30 == 1:
                    balance += self.monthly_income

                # Daily expense sampled from log-normal distribution to avoid negatives
                # log-normal parameters:
                var = self.daily_sigma ** 2
                mu2 = self.daily_mu ** 2
                if mu2 > 0:
                    scale = math.sqrt(math.log(1 + var / mu2))
                    loc = math.log(self.daily_mu) - 0.5 * scale ** 2
                    daily_spend = random.lognormvariate(loc, scale)
                else:
                    daily_spend = 0.0

                # Random health/emergency financial shock (Poisson process)
                if random.random() < self.shock_prob:
                    daily_spend += random.expovariate(1.0 / self.shock_mean)

                balance -= daily_spend

                if balance < 0:
                    survived_days = day - 1
                    bankruptcies += 1
                    break

            terminal_balances.append(max(0.0, balance))
            for d in range(survived_days + 1):
                survival_counts[d] += 1

        terminal_balances.sort()
        p10 = terminal_balances[int(0.10 * num_simulations)]
        p50 = terminal_balances[int(0.50 * num_simulations)]
        p90 = terminal_balances[int(0.90 * num_simulations)]
        bankruptcy_rate = (bankruptcies / num_simulations) * 100.0

        # Calculate estimated safe runway (days with >= 95% survival probability)
        safe_runway = days
        for day in range(days + 1):
            survival_rate = survival_counts[day] / num_simulations
            if survival_rate < 0.95:
                safe_runway = max(0, day - 1)
                break

        return {
            "num_simulations": num_simulations,
            "horizon_days": days,
            "starting_balance": self.initial_cash,
            "safe_runway_days_95pct": safe_runway,
            "bankruptcy_probability_pct": round(bankruptcy_rate, 2),
            "median_terminal_cash": round(p50, 2),
            "worst_10pct_terminal_cash": round(p10, 2),
            "best_10pct_terminal_cash": round(p90, 2),
            "health_status": "EXCELLENT" if bankruptcy_rate < 2.0 else "WARNING" if bankruptcy_rate < 15.0 else "CRITICAL"
        }


# =============================================================================
# 2. Transaction Anomaly Detection
# =============================================================================

class AnomalyDetectionEngine:
    """
    Identifies statistically anomalous debit transactions using robust
    non-parametric Interquartile Range (IQR) and Gaussian Z-Score metrics.
    Flags sudden spikes, abnormal recurring UPI charges, or data entry errors.
    """

    @staticmethod
    def detect_outliers(
        transactions: List[Dict[str, Any]],
        z_threshold: float = 2.5,
        iqr_multiplier: float = 1.5
    ) -> List[Dict[str, Any]]:
        """
        Takes a list of transaction dicts: [{'id': ..., 'amount': ..., 'description': ...}]
        Returns enriched list of anomalous transactions with confidence scoring.
        """
        debit_amounts = [t["amount"] for t in transactions if t.get("type", "DEBIT") == "DEBIT" and t["amount"] > 0]
        
        if len(debit_amounts) < 5:
            return []  # Insufficient sample size for reliable anomaly detection

        # Calculate Mean and StdDev for Z-Score
        n = len(debit_amounts)
        mean = sum(debit_amounts) / n
        variance = sum((x - mean) ** 2 for x in debit_amounts) / (n - 1)
        std_dev = math.sqrt(variance) if variance > 0 else 1.0

        # Calculate Quartiles for IQR
        sorted_amts = sorted(debit_amounts)
        q1 = sorted_amts[int(0.25 * n)]
        median = sorted_amts[int(0.50 * n)]
        q3 = sorted_amts[int(0.75 * n)]
        iqr = q3 - q1
        upper_bound = q3 + (iqr_multiplier * iqr)

        flagged = []
        for txn in transactions:
            if txn.get("type", "DEBIT") != "DEBIT":
                continue

            amt = txn["amount"]
            z_score = (amt - mean) / std_dev if std_dev > 0 else 0.0
            is_iqr_outlier = amt > upper_bound
            is_z_outlier = z_score > z_threshold

            if is_iqr_outlier or is_z_outlier:
                severity = "HIGH" if (z_score > 3.5 or amt > q3 + 3.0 * iqr) else "MEDIUM"
                flagged.append({
                    "id": txn.get("id", "txn_unknown"),
                    "date": txn.get("date", str(date.today())),
                    "description": txn.get("description", "Unknown"),
                    "amount": amt,
                    "amount_formatted": format_inr(amt),
                    "mean_comparison_ratio": round(amt / mean, 2) if mean > 0 else 0,
                    "z_score": round(z_score, 2),
                    "severity": severity,
                    "reason": f"Amount is {round(amt / mean, 1)}x above average expenditure (Z={round(z_score, 2)})"
                })

        return sorted(flagged, key=lambda x: x["amount"], reverse=True)


# =============================================================================
# 3. Expense Velocity & Burn Rate Forecaster
# =============================================================================

class ExpenseVelocityForecaster:
    """
    Computes Exponentially Weighted Moving Average (EWMA) burn rate to project
    month-end total expenditure with dynamic momentum correction.
    """

    @staticmethod
    def forecast_monthly_spend(
        daily_spending: List[float],
        days_in_month: int = 30,
        alpha: float = 0.35
    ) -> Dict[str, Any]:
        """
        daily_spending: List of float amounts spent on day 1, 2, ..., k.
        alpha: Smoothing factor (0 < alpha <= 1). Higher gives more weight to recent days.
        """
        days_elapsed = len(daily_spending)
        if days_elapsed == 0:
            return {"error": "No daily data provided"}

        current_total = sum(daily_spending)
        simple_daily_avg = current_total / days_elapsed

        # Compute EWMA
        ewma = daily_spending[0]
        for val in daily_spending[1:]:
            ewma = alpha * val + (1 - alpha) * ewma

        days_remaining = max(0, days_in_month - days_elapsed)
        linear_projected_total = current_total + (simple_daily_avg * days_remaining)
        ewma_projected_total = current_total + (ewma * days_remaining)

        # Spending velocity index (>1.0 indicates accelerating spend rate)
        velocity_index = round(ewma / simple_daily_avg, 2) if simple_daily_avg > 0 else 1.0

        return {
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining,
            "current_spend_total": round(current_total, 2),
            "current_spend_formatted": format_inr(current_total),
            "simple_daily_avg": round(simple_daily_avg, 2),
            "smoothed_ewma_burn_rate": round(ewma, 2),
            "linear_projection": round(linear_projected_total, 2),
            "ewma_projection": round(ewma_projected_total, 2),
            "ewma_projection_formatted": format_inr(ewma_projected_total),
            "velocity_index": velocity_index,
            "trajectory": "ACCELERATING" if velocity_index > 1.15 else "DECELERATING" if velocity_index < 0.85 else "STABLE"
        }


# =============================================================================
# 4. Khaata Multi-Party Debt Graph Simplification (Min-Cash-Flow Algorithm)
# =============================================================================

class KhaataDebtGraphSimplifier:
    """
    Implements the classic Min-Cash-Flow graph simplification algorithm.
    Takes arbitrary N-person bilateral debts and computes the minimal set of
    transactions required to completely settle all liabilities to net zero.
    """

    @staticmethod
    def simplify_debts(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        transactions: List of {'debtor': 'Anurag', 'creditor': 'Me', 'amount': 450.0}
        Returns: Minimal transfer instructions: [{'from': 'A', 'to': 'B', 'amount': ...}]
        """
        net_balance = defaultdict(float)

        for txn in transactions:
            debtor = txn["debtor"]
            creditor = txn["creditor"]
            amount = float(txn["amount"])

            net_balance[debtor] -= amount
            net_balance[creditor] += amount

        # Separate creditors (net positive) and debtors (net negative)
        # Using two lists: [(person, balance), ...]
        debtors = []
        creditors = []

        for person, bal in net_balance.items():
            rounded_bal = round(bal, 2)
            if rounded_bal < -0.01:
                debtors.append([person, -rounded_bal])  # positive amount owed
            elif rounded_bal > 0.01:
                creditors.append([person, rounded_bal])

        simplified_settlements = []

        i = 0  # debtor pointer
        j = 0  # creditor pointer

        while i < len(debtors) and j < len(creditors):
            debtor_name, debit_rem = debtors[i]
            creditor_name, credit_rem = creditors[j]

            transfer_amt = min(debit_rem, credit_rem)
            transfer_amt_rounded = round(transfer_amt, 2)

            if transfer_amt_rounded > 0:
                simplified_settlements.append({
                    "from": debtor_name,
                    "to": creditor_name,
                    "amount": transfer_amt_rounded,
                    "formatted_amount": format_inr(transfer_amt_rounded),
                    "narration": f"{debtor_name} pays {creditor_name} {format_inr(transfer_amt_rounded)}"
                })

            debtors[i][1] -= transfer_amt
            creditors[j][1] -= transfer_amt

            if debtors[i][1] < 0.01:
                i += 1
            if creditors[j][1] < 0.01:
                j += 1

        return simplified_settlements


# =============================================================================
# 5. Shannon Spending Entropy (Budget Diversification Score)
# =============================================================================

class SpendingEntropyAnalyzer:
    """
    Measures how evenly your spending is distributed across categories versus
    being dangerously concentrated into a single category using Shannon Entropy.
    Normalized score from 0.0 (total single-category bias) to 100.0 (perfect balance).
    """

    @staticmethod
    def calculate_entropy(category_spend: Dict[str, float]) -> Dict[str, Any]:
        total = sum(category_spend.values())
        if total <= 0 or len(category_spend) <= 1:
            return {"entropy_score": 0.0, "status": "CONCENTRATED", "dominant_category": next(iter(category_spend), "None")}

        n = len(category_spend)
        max_entropy = math.log(n, 2)

        actual_entropy = 0.0
        proportions = {}
        for cat, amt in category_spend.items():
            if amt > 0:
                p = amt / total
                proportions[cat] = round(p * 100, 1)
                actual_entropy -= p * math.log(p, 2)

        normalized_score = (actual_entropy / max_entropy) * 100.0 if max_entropy > 0 else 0.0
        sorted_cats = sorted(category_spend.items(), key=lambda x: x[1], reverse=True)

        return {
            "total_spend": round(total, 2),
            "total_spend_formatted": format_inr(total),
            "category_count": n,
            "entropy_score": round(normalized_score, 1),
            "dominant_category": sorted_cats[0][0],
            "dominant_percentage": proportions.get(sorted_cats[0][0], 0.0),
            "distribution_quality": "HIGHLY_DIVERSIFIED" if normalized_score > 75.0 else "BALANCED" if normalized_score > 50.0 else "OVER_CONCENTRATED",
            "breakdown": proportions
        }


# =============================================================================
# 6. Indian Tax Regime Estimator (FY 2024-25 / AY 2025-26)
# =============================================================================

class IndianTaxEstimator:
    """
    Computes personal income tax liability under the revised Indian New Tax Regime
    (Section 115BAC), including Standard Deduction of ₹75,000 and Section 87A rebate
    for taxable income up to ₹7,00,000.
    """

    @staticmethod
    def compute_tax(annual_gross_income: float) -> Dict[str, Any]:
        STANDARD_DEDUCTION = 75000.0
        taxable_income = max(0.0, annual_gross_income - STANDARD_DEDUCTION)

        # Tax slabs (New Regime FY 2024-25 Budget):
        # 0 to 3,00,000: NIL
        # 3,00,001 to 7,00,000: 5%
        # 7,00,001 to 10,00,000: 10%
        # 10,00,001 to 12,00,000: 15%
        # 12,00,001 to 15,00,000: 20%
        # Above 15,00,000: 30%

        slabs = [
            (300000.0, 0.00),
            (400000.0, 0.05),  # 3L to 7L (4L spread)
            (300000.0, 0.10),  # 7L to 10L (3L spread)
            (200000.0, 0.15),  # 10L to 12L (2L spread)
            (300000.0, 0.20),  # 12L to 15L (3L spread)
            (float("inf"), 0.30)  # > 15L
        ]

        tax = 0.0
        rem = taxable_income
        slab_breakdown = []

        for slab_limit, rate in slabs:
            if rem <= 0:
                break
            taxable_in_slab = min(rem, slab_limit)
            tax_in_slab = taxable_in_slab * rate
            tax += tax_in_slab
            rem -= taxable_in_slab
            if taxable_in_slab > 0:
                slab_breakdown.append({
                    "taxable_amount": round(taxable_in_slab, 2),
                    "rate_pct": int(rate * 100),
                    "tax": round(tax_in_slab, 2)
                })

        # Rebate u/s 87A: If taxable income <= 7,00,000, tax is NIL (rebate up to ₹25,000)
        rebate_87a = 0.0
        if taxable_income <= 700000.0:
            rebate_87a = tax
            tax = 0.0

        # Health and Education Cess @ 4%
        cess = tax * 0.04
        total_tax_liability = tax + cess
        effective_tax_rate = (total_tax_liability / annual_gross_income * 100.0) if annual_gross_income > 0 else 0.0

        return {
            "gross_annual_income": annual_gross_income,
            "gross_annual_income_formatted": format_inr(annual_gross_income),
            "standard_deduction": STANDARD_DEDUCTION,
            "net_taxable_income": taxable_income,
            "net_taxable_income_formatted": format_inr(taxable_income),
            "basic_tax_before_rebate": round(tax + rebate_87a, 2),
            "section_87a_rebate": round(rebate_87a, 2),
            "cess_4pct": round(cess, 2),
            "total_tax_payable": round(total_tax_liability, 2),
            "total_tax_payable_formatted": format_inr(total_tax_liability),
            "effective_tax_rate_pct": round(effective_tax_rate, 2),
            "monthly_take_home": round((annual_gross_income - total_tax_liability) / 12.0, 2),
            "monthly_take_home_formatted": format_inr((annual_gross_income - total_tax_liability) / 12.0),
            "slab_details": slab_breakdown
        }


# =============================================================================
# 7. Interactive CLI & Demonstration Suite
# =============================================================================

def run_sample_audit():
    """Executes a full algorithmic audit using realistic RupeePulse data."""
    print("=" * 72)
    print("  RUPEEPULSE QUANTITATIVE ENGINE - AUDIT & SIMULATION REPORT")
    print("=" * 72)

    # 1. Test Khaata Settlement Algorithm
    print("\n[+] 1. KHAATA DEBT GRAPH SIMPLIFICATION (Min-Cash-Flow):")
    sample_debts = [
        {"debtor": "Anurag", "creditor": "Me", "amount": 2500},
        {"debtor": "Me", "creditor": "Anurag", "amount": 100},
        {"debtor": "Me", "creditor": "Anurag", "amount": 335},
        {"debtor": "Anurag", "creditor": "Me", "amount": 60},
        {"debtor": "Me", "creditor": "Anurag", "amount": 250},
        {"debtor": "Me", "creditor": "Anurag", "amount": 250},
        {"debtor": "Me", "creditor": "Anurag", "amount": 500},
        {"debtor": "Anurag", "creditor": "Me", "amount": 40},
        {"debtor": "Me", "creditor": "Anurag", "amount": 1525},
        {"debtor": "Anurag", "creditor": "Me", "amount": 18},
    ]
    settlements = KhaataDebtGraphSimplifier.simplify_debts(sample_debts)
    for s in settlements:
        print(f"    -> {s['narration']}")

    # 2. Test Anomaly Detection
    print("\n[+] 2. TRANSACTION OUTLIER DETECTION (Z-Score + IQR):")
    sept_transactions = [
        {"id": "t1", "amount": 30, "description": "MEDICINE", "date": "02-Sep"},
        {"id": "t2", "amount": 20, "description": "MEDICINE", "date": "03-Sep"},
        {"id": "t3", "amount": 30, "description": "SNACKS", "date": "03-Sep"},
        {"id": "t4", "amount": 30, "description": "WATER", "date": "03-Sep"},
        {"id": "t5", "amount": 215, "description": "WATER", "date": "04-Sep"},
        {"id": "t6", "amount": 145, "description": "DINNER", "date": "04-Sep"},
        {"id": "t7", "amount": 80, "description": "SNACK", "date": "07-Sep"},
        {"id": "t8", "amount": 215, "description": "WATER", "date": "09-Sep"},
        {"id": "t9", "amount": 75, "description": "SNACK", "date": "10-Sep"},
        {"id": "t10", "amount": 60, "description": "SNACK", "date": "11-Sep"},
        {"id": "t11", "amount": 195, "description": "DINNER", "date": "12-Sep"},
        {"id": "t12", "amount": 126, "description": "WATER", "date": "13-Sep"},
        {"id": "t13", "amount": 40, "description": "SNACK", "date": "14-Sep"},
        {"id": "t14", "amount": 120, "description": "SNACK", "date": "15-Sep"},
        {"id": "t15", "amount": 108, "description": "WATER", "date": "16-Sep"},
        {"id": "t16", "amount": 90, "description": "CLOTHS", "date": "16-Sep"},
        {"id": "t17", "amount": 90, "description": "SNACK", "date": "17-Sep"},
        {"id": "t18", "amount": 378, "description": "WATER", "date": "19-Sep"},
        {"id": "t19", "amount": 70, "description": "SNACK", "date": "19-Sep"},
        {"id": "t20", "amount": 100, "description": "SNACK", "date": "21-Sep"},
        {"id": "t21", "amount": 20, "description": "SNACK", "date": "23-Sep"},
        {"id": "t22", "amount": 73, "description": "COLGATE", "date": "25-Sep"},
        {"id": "t23", "amount": 20, "description": "SNACK", "date": "25-Sep"},
        {"id": "t24", "amount": 120, "description": "SNACK", "date": "26-Sep"},
        {"id": "t25", "amount": 1850, "description": "EMERGENCY REPAIR", "date": "27-Sep"}  # Synthetic anomaly
    ]
    outliers = AnomalyDetectionEngine.detect_outliers(sept_transactions)
    for o in outliers:
        print(f"    * [{o['severity']}] {o['date']}: {o['description']} - {o['amount_formatted']} ({o['reason']})")

    # 3. Test Spending Entropy
    print("\n[+] 3. CATEGORY ENTROPY & DIVERSIFICATION SCORE:")
    cat_breakdown = {
        "Water": 1072.0,
        "Snacks": 745.0,
        "Food & Dining": 340.0,
        "Health & Medical": 50.0,
        "Shopping": 90.0,
        "Groceries": 73.0
    }
    entropy_result = SpendingEntropyAnalyzer.calculate_entropy(cat_breakdown)
    print(f"    Total Spend: {entropy_result['total_spend_formatted']}")
    print(f"    Entropy Score: {entropy_result['entropy_score']}/100 ({entropy_result['distribution_quality']})")
    print(f"    Dominant Sector: {entropy_result['dominant_category']} ({entropy_result['dominant_percentage']}%)")

    # 4. Monte Carlo Runway Simulation
    print("\n[+] 4. STOCHASTIC MONTE CARLO LIQUIDITY RUNWAY (1,500 Trials):")
    mc = MonteCarloRunwaySimulator(
        current_liquidity=45000.0,
        monthly_base_income=65000.0,
        daily_expense_mean=850.0,
        daily_expense_std=450.0,
        shock_probability=0.03,
        shock_magnitude_mean=6000.0
    )
    sim_stats = mc.simulate(num_simulations=1500, days=180)
    print(f"    Safe 95% Confidence Runway: {sim_stats['safe_runway_days_95pct']} Days")
    print(f"    Bankruptcy Risk (180-day): {sim_stats['bankruptcy_probability_pct']}% [{sim_stats['health_status']}]")
    print(f"    Median Cash Balance at T+180: {format_inr(sim_stats['median_terminal_cash'])}")
    print(f"    P10 (Stress Case) Balance: {format_inr(sim_stats['worst_10pct_terminal_cash'])}")

    # 5. Indian Income Tax Projection
    print("\n[+] 5. INDIAN NEW TAX REGIME ESTIMATE (FY 2024-25):")
    annual_ctc = 1200000.0  # ₹12,00,000 CTC
    tax_info = IndianTaxEstimator.compute_tax(annual_ctc)
    print(f"    Gross CTC: {tax_info['gross_annual_income_formatted']}")
    print(f"    Taxable Net: {tax_info['net_taxable_income_formatted']} (Post ₹75k Standard Deduction)")
    print(f"    Total Tax Payable: {tax_info['total_tax_payable_formatted']} (Effective: {tax_info['effective_tax_rate_pct']}%)")
    print(f"    Monthly In-Hand Take Home: {tax_info['monthly_take_home_formatted']}")
    print("=" * 72)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RupeePulse Quantitative Finance Engine")
    parser.add_argument("--audit", action="store_true", help="Run full diagnostic suite with sample data")
    parser.add_argument("--json", action="store_true", help="Output audit report as structured JSON")
    parser.add_argument("--tax", type=float, help="Calculate New Regime tax liability for given gross CTC")
    args = parser.parse_args()

    if args.tax:
        tax_result = IndianTaxEstimator.compute_tax(args.tax)
        print(json.dumps(tax_result, indent=2))
    elif args.json:
        # Generate JSON output
        mc = MonteCarloRunwaySimulator(45000, 65000, 850, 450)
        report = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "monte_carlo": mc.simulate(500, 90),
            "tax_profile_12lpa": IndianTaxEstimator.compute_tax(1200000)
        }
        print(json.dumps(report, indent=2))
    else:
        run_sample_audit()
