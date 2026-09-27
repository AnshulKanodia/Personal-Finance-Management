"""
Unit tests for RupeePulse Quantitative Finance Engine.
Verifies Monte Carlo invariants, Khaata graph netting, Anomaly Detection, and Tax Slabs.
"""

import unittest
from engine.finance_engine import (
    format_inr,
    MonteCarloRunwaySimulator,
    AnomalyDetectionEngine,
    ExpenseVelocityForecaster,
    KhaataDebtGraphSimplifier,
    SpendingEntropyAnalyzer,
    IndianTaxEstimator,
)


class TestFinanceEngine(unittest.TestCase):

    def test_inr_formatting(self):
        self.assertEqual(format_inr(0), "₹0.00")
        self.assertEqual(format_inr(500), "₹500.00")
        self.assertEqual(format_inr(15000), "₹15,000.00")
        self.assertEqual(format_inr(1500000), "₹15,00,000.00")
        self.assertEqual(format_inr(-450), "-₹450.00")

    def test_khaata_simplifier_net_zero(self):
        # A owes B 100, B owes C 100 -> A should pay C 100 directly
        debts = [
            {"debtor": "A", "creditor": "B", "amount": 100},
            {"debtor": "B", "creditor": "C", "amount": 100},
        ]
        settlements = KhaataDebtGraphSimplifier.simplify_debts(debts)
        self.assertEqual(len(settlements), 1)
        self.assertEqual(settlements[0]["from"], "A")
        self.assertEqual(settlements[0]["to"], "C")
        self.assertEqual(settlements[0]["amount"], 100.0)

    def test_anomaly_detection_identifies_huge_spike(self):
        normal_txns = [{"id": f"t{i}", "amount": 50, "type": "DEBIT"} for i in range(20)]
        spike = [{"id": "spike", "amount": 5000, "type": "DEBIT"}]
        outliers = AnomalyDetectionEngine.detect_outliers(normal_txns + spike)
        self.assertTrue(any(o["id"] == "spike" for o in outliers))
        self.assertEqual(outliers[0]["severity"], "HIGH")

    def test_expense_velocity(self):
        daily = [100.0, 100.0, 100.0, 100.0, 100.0]
        res = ExpenseVelocityForecaster.forecast_monthly_spend(daily, days_in_month=30)
        self.assertEqual(res["current_spend_total"], 500.0)
        self.assertEqual(res["ewma_projection"], 3000.0)
        self.assertEqual(res["trajectory"], "STABLE")

    def test_tax_slab_below_7_lakh_is_zero(self):
        # CTC 7,00,000 with Standard deduction is <= 7L taxable -> Section 87A rebate makes it ₹0
        res = IndianTaxEstimator.compute_tax(700000)
        self.assertEqual(res["total_tax_payable"], 0.0)

    def test_tax_slab_12_lakh(self):
        res = IndianTaxEstimator.compute_tax(1200000)
        # Taxable = 11,25,000
        # 3L-7L @ 5% = 20,000
        # 7L-10L @ 10% = 30,000
        # 10L-11.25L @ 15% = 18,750
        # Total = 68,750 + 4% cess (2750) = 71,500
        self.assertEqual(res["total_tax_payable"], 71500.0)

    def test_monte_carlo_positive_runway(self):
        mc = MonteCarloRunwaySimulator(
            current_liquidity=50000,
            monthly_base_income=50000,
            daily_expense_mean=500,
            daily_expense_std=100,
            shock_probability=0.01
        )
        sim = mc.simulate(num_simulations=200, days=60)
        self.assertGreaterEqual(sim["safe_runway_days_95pct"], 50)
        self.assertLessEqual(sim["bankruptcy_probability_pct"], 5.0)


if __name__ == "__main__":
    unittest.main()
