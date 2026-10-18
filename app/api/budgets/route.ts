import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (!Category) {
      // Ensure Category model is loaded in memory for populate
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = searchParams.get("month") || defaultMonth;

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json(
        { success: false, message: "Invalid month format. Expected YYYY-MM." },
        { status: 400 }
      );
    }

    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10) - 1;
    const startOfMonth = new Date(year, m, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, m + 1, 0, 23, 59, 59, 999);

    const totalDaysInMonth = new Date(year, m + 1, 0).getDate();
    const isCurrentMonth =
      now.getFullYear() === year && now.getMonth() === m;
    const isPastMonth =
      now.getFullYear() > year || (now.getFullYear() === year && now.getMonth() > m);

    let daysElapsed = totalDaysInMonth;
    let daysRemaining = 0;

    if (isCurrentMonth) {
      daysElapsed = Math.min(totalDaysInMonth, Math.max(1, now.getDate()));
      daysRemaining = Math.max(1, totalDaysInMonth - now.getDate() + 1);
    } else if (isPastMonth) {
      daysElapsed = totalDaysInMonth;
      daysRemaining = 0;
    } else {
      // Future month
      daysElapsed = 1;
      daysRemaining = totalDaysInMonth;
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Fetch active budgets for month, actual expense transactions, and today's expenses in parallel
    const [budgets, spendAggregation, todaySpendAggregation] = await Promise.all([
      Budget.find({ month })
        .populate("category", "name color icon")
        .sort({ monthlyLimit: -1 })
        .lean(),
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
            spent: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      isCurrentMonth
        ? Transaction.aggregate([
            {
              $match: {
                type: "EXPENSE",
                date: { $gte: startOfToday, $lte: endOfToday },
              },
            },
            {
              $group: {
                _id: "$category",
                spent: { $sum: "$amount" },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    // Map spend by category ObjectId string
    const spendMap = new Map<string, { spent: number; count: number }>();
    spendAggregation.forEach((item) => {
      if (item._id) {
        spendMap.set(item._id.toString(), {
          spent: Number(item.spent) || 0,
          count: item.count || 0,
        });
      }
    });

    const todayMap = new Map<string, number>();
    todaySpendAggregation.forEach((item: any) => {
      if (item._id) {
        todayMap.set(item._id.toString(), Number(item.spent) || 0);
      }
    });

    let totalBudget = 0;
    let totalSpent = 0;

    const enrichedBudgets = budgets.map((b: any) => {
      const catId = (b.category?._id || b.category)?.toString();
      const catSpend = catId ? spendMap.get(catId) : null;
      const spent = catSpend ? catSpend.spent : 0;
      const count = catSpend ? catSpend.count : 0;
      const todaySpent = catId ? (todayMap.get(catId) || 0) : 0;
      const limit = Number(b.monthlyLimit);
      const remaining = limit - spent;
      const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const threshold = b.alertThreshold || 80;

      const dailyRunRate = daysElapsed > 0 ? Math.round(spent / daysElapsed) : 0;
      const recommendedDailySpend =
        daysRemaining > 0 && remaining > 0 ? Math.round(remaining / daysRemaining) : 0;
      const projectedMonthEndSpend =
        daysElapsed > 0 ? Math.round((spent / daysElapsed) * totalDaysInMonth) : spent;

      let status: "SAFE" | "WARNING" | "OVER_BUDGET" = "SAFE";
      if (spent >= limit) {
        status = "OVER_BUDGET";
      } else if (percentUsed >= threshold) {
        status = "WARNING";
      }

      let burnPace: "ON_TRACK" | "WARNING" | "OVERSPENDING" | "BREACHED" = "ON_TRACK";
      if (spent >= limit) {
        burnPace = "BREACHED";
      } else if (projectedMonthEndSpend > limit) {
        burnPace = "OVERSPENDING";
      } else if (percentUsed >= threshold || projectedMonthEndSpend >= limit * (threshold / 100)) {
        burnPace = "WARNING";
      }

      if (b.isActive !== false) {
        totalBudget += limit;
        totalSpent += spent;
      }

      return {
        _id: b._id,
        category: b.category,
        monthlyLimit: limit,
        month: b.month,
        alertThreshold: threshold,
        isActive: b.isActive !== false,
        notes: b.notes || "",
        spent,
        todaySpent,
        remaining,
        percentUsed,
        dailyRunRate,
        recommendedDailySpend,
        projectedMonthEndSpend,
        burnPace,
        transactionCount: count,
        status,
        overspendAmount: spent > limit ? spent - limit : 0,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    });

    const totalRemaining = totalBudget - totalSpent;
    const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return NextResponse.json({
      success: true,
      month,
      data: enrichedBudgets,
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining,
        overallPercent,
        activeBudgetsCount: enrichedBudgets.filter((b) => b.isActive).length,
        overBudgetCount: enrichedBudgets.filter((b) => b.status === "OVER_BUDGET").length,
        warningCount: enrichedBudgets.filter((b) => b.status === "WARNING").length,
        overspendingCount: enrichedBudgets.filter((b) => b.burnPace === "OVERSPENDING").length,
        daysInMonth: totalDaysInMonth,
        daysElapsed,
        daysRemaining,
        recommendedDailyBurn:
          daysRemaining > 0 && totalRemaining > 0 ? Math.round(totalRemaining / daysRemaining) : 0,
        avgDailyBurn: daysElapsed > 0 ? Math.round(totalSpent / daysElapsed) : 0,
        projectedTotalSpend:
          daysElapsed > 0 ? Math.round((totalSpent / daysElapsed) * totalDaysInMonth) : totalSpent,
        isCurrentMonth,
      },
    });
  } catch (error: any) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { category, monthlyLimit, month, alertThreshold = 80, notes = "", isActive = true } = body;

    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      return NextResponse.json(
        { success: false, message: "A valid category is required" },
        { status: 400 }
      );
    }

    const limitNum = Number(monthlyLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      return NextResponse.json(
        { success: false, message: "Monthly budget limit must be greater than zero" },
        { status: 400 }
      );
    }

    const now = new Date();
    const targetMonth =
      month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
        ? month
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const thresholdNum = Math.min(100, Math.max(10, Number(alertThreshold) || 80));

    // Upsert budget: update if exists for this (category, month), otherwise create new
    const budget = await Budget.findOneAndUpdate(
      {
        category: new mongoose.Types.ObjectId(category),
        month: targetMonth,
      },
      {
        monthlyLimit: limitNum,
        alertThreshold: thresholdNum,
        notes: notes ? notes.trim() : "",
        isActive: Boolean(isActive),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    ).populate("category", "name color icon");

    return NextResponse.json(
      {
        success: true,
        message: "Category budget saved successfully",
        data: budget,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error saving budget:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save budget" },
      { status: 500 }
    );
  }
}
