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

    // 1. Total Spend and Income this month
    const monthlyTotals = await Transaction.aggregate([
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
    ]);

    let totalSpendThisMonth = 0;
    let totalIncomeThisMonth = 0;

    monthlyTotals.forEach((item) => {
      if (item._id === "EXPENSE") totalSpendThisMonth = item.total;
      if (item._id === "INCOME") totalIncomeThisMonth = item.total;
    });

    // 2. All-time Cash / Net Balance (All time Income - All time Expense)
    const allTimeTotals = await Transaction.aggregate([
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    let allTimeIncome = 0;
    let allTimeExpense = 0;
    allTimeTotals.forEach((item) => {
      if (item._id === "INCOME") allTimeIncome = item.total;
      if (item._id === "EXPENSE") allTimeExpense = item.total;
    });
    const cashBalance = allTimeIncome - allTimeExpense;

    // 3. Friend Dues - Net per friend (so reciprocal dues offset into one net balance)
    const duesAggregation = await FriendDue.aggregate([
      { $match: { isSettled: false } },
      {
        $group: {
          _id: { friendId: "$friendId", type: "$type" },
          total: { $sum: "$amount" },
        },
      },
    ]);

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

    // 4. Spend by Category this month (for Pie/Donut Chart)
    const categorySpendAggregation = await Transaction.aggregate([
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
    ]);

    // 5. Payment Mode Breakdown this month
    const paymentModeAggregation = await Transaction.aggregate([
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
    ]);

    // 6. Recent 8 transactions
    const recentTransactions = await Transaction.find()
      .populate("category", "name color icon")
      .sort({ date: -1, createdAt: -1 })
      .limit(8)
      .lean();

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
