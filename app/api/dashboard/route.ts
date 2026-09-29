import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import FriendDue from "@/models/FriendDue";
import Category from "@/models/Category";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (!Category) {
      // Ensure model registration
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // Optional format: YYYY-MM

    // Current month date boundaries
    const now = new Date();
    let startOfMonth: Date;
    let endOfMonth: Date;

    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      startOfMonth = new Date(year, month - 1, 1);
      endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Velocity calculation boundaries (Weekly & Monthly)
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const startOfCurrentWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
    const endOfCurrentWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfLastWeek = new Date(startOfCurrentWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeekSameDay = new Date(endOfCurrentWeek);
    endOfLastWeekSameDay.setDate(endOfLastWeekSameDay.getDate() - 7);

    const startOfLastMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 1, 1);
    const endOfLastMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), 0, 23, 59, 59, 999);

    // Run aggregations concurrently in parallel for maximum speed
    const [
      monthlyTotals,
      allTimeTotals,
      duesAggregation,
      categorySpendAggregation,
      paymentModeAggregation,
      recentTransactions,
      thisWeekExpenses,
      lastWeekExpenses,
      lastMonthExpenses,
    ] = await Promise.all([
      // 1. Total Spend and Income this month
      Transaction.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 2. All-time Cash / Net Balance
      Transaction.aggregate([
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 3. Friend Dues - Net per friend
      FriendDue.aggregate([
        { $match: { isSettled: false } },
        {
          $group: {
            _id: { friendId: "$friendId", type: "$type" },
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 4. Spend by Category this month
      Transaction.aggregate([
        {
          $match: {
            type: "EXPENSE",
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryDoc",
          },
        },
        {
          $unwind: {
            path: "$categoryDoc",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: { $ifNull: ["$categoryDoc.name", "Uncategorized"] },
            color: { $ifNull: ["$categoryDoc.color", "#71717a"] },
            icon: { $ifNull: ["$categoryDoc.icon", "Tag"] },
            total: 1,
            count: 1,
          },
        },
        { $sort: { total: -1 } },
      ]),

      // 5. Payment Mode Breakdown this month
      Transaction.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: { mode: "$paymentMode", type: "$type" },
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 6. Recent 5 transactions
      Transaction.find()
        .populate("category", "name color icon")
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .lean(),

      // 7. This week expenses
      Transaction.aggregate([
        {
          $match: {
            type: "EXPENSE",
            date: { $gte: startOfCurrentWeek, $lte: endOfCurrentWeek },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 8. Last week expenses (same days comparison)
      Transaction.aggregate([
        {
          $match: {
            type: "EXPENSE",
            date: { $gte: startOfLastWeek, $lte: endOfLastWeekSameDay },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 9. Last month full expenses
      Transaction.aggregate([
        {
          $match: {
            type: "EXPENSE",
            date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    let totalSpendThisMonth = 0;
    let totalIncomeThisMonth = 0;

    monthlyTotals.forEach((item) => {
      if (item._id === "EXPENSE") totalSpendThisMonth = item.total;
      if (item._id === "INCOME") totalIncomeThisMonth = item.total;
    });

    let allTimeIncome = 0;
    let allTimeExpense = 0;
    allTimeTotals.forEach((item) => {
      if (item._id === "INCOME") allTimeIncome = item.total;
      if (item._id === "EXPENSE") allTimeExpense = item.total;
    });
    const cashBalance = allTimeIncome - allTimeExpense;

    const friendBalances: Record<string, { toGive: number; toTake: number }> = {};
    duesAggregation.forEach((item) => {
      const fId = item._id.friendId.toString();
      if (!friendBalances[fId]) friendBalances[fId] = { toGive: 0, toTake: 0 };
      if (item._id.type === "TO_GIVE") friendBalances[fId].toGive += item.total;
      if (item._id.type === "TO_TAKE") friendBalances[fId].toTake += item.total;
    });

    let netOwedToMe = 0; // Sum of positive net balances (friends who owe me)
    let netIOwe = 0;     // Sum of negative net balances (friends I owe)

    Object.values(friendBalances).forEach((bal) => {
      const net = bal.toTake - bal.toGive;
      if (net > 0) netOwedToMe += net;
      if (net < 0) netIOwe += Math.abs(net);
    });

    // Velocity calculations
    const currentWeekSpend = thisWeekExpenses[0]?.total || 0;
    const lastWeekSpend = lastWeekExpenses[0]?.total || 0;
    const lastMonthSpend = lastMonthExpenses[0]?.total || 0;

    const daysPassedInWeek = Math.max(1, dayOfWeek + 1);
    const weeklyBurnPerDay = Math.round(currentWeekSpend / daysPassedInWeek);
    let weeklyChangePercent = 0;
    if (lastWeekSpend > 0) {
      weeklyChangePercent = Math.round(((currentWeekSpend - lastWeekSpend) / lastWeekSpend) * 100);
    }
    const weeklyPace: "SLOWER" | "STEADY" | "FASTER" =
      weeklyChangePercent < -5 ? "SLOWER" : weeklyChangePercent > 5 ? "FASTER" : "STEADY";

    const daysPassedInMonth = Math.max(1, now.getDate());
    const monthlyBurnPerDay = Math.round(totalSpendThisMonth / daysPassedInMonth);
    let monthlyChangePercent = 0;
    if (lastMonthSpend > 0) {
      monthlyChangePercent = Math.round(((totalSpendThisMonth - lastMonthSpend) / lastMonthSpend) * 100);
    }
    const monthlyPace: "SLOWER" | "STEADY" | "FASTER" =
      monthlyChangePercent < -5 ? "SLOWER" : monthlyChangePercent > 5 ? "FASTER" : "STEADY";

    return NextResponse.json({
      success: true,
      data: {
        totalSpendThisMonth,
        totalIncomeThisMonth,
        cashBalance,
        netOwedToMe,
        netIOwe,
        categorySpend: categorySpendAggregation,
        paymentModes: paymentModeAggregation,
        recentTransactions,
        velocity: {
          weekly: {
            currentSpend: currentWeekSpend,
            previousSpend: lastWeekSpend,
            changePercent: weeklyChangePercent,
            burnRatePerDay: weeklyBurnPerDay,
            pace: weeklyPace,
          },
          monthly: {
            currentSpend: totalSpendThisMonth,
            previousSpend: lastMonthSpend,
            changePercent: monthlyChangePercent,
            burnRatePerDay: monthlyBurnPerDay,
            pace: monthlyPace,
          },
        },
        month: monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      },
    });
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
