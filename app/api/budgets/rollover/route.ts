import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    if (!Category) {
      // Ensure Category model is loaded in memory for populate
    }

    const body = await req.json();
    const { targetMonth, fromMonth, carryForwardSurplus = true } = body;

    if (!targetMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
      return NextResponse.json(
        { success: false, message: "Valid targetMonth in YYYY-MM format is required" },
        { status: 400 }
      );
    }

    const [tYearStr, tMonthStr] = targetMonth.split("-");
    const tYear = parseInt(tYearStr, 10);
    const tMonth = parseInt(tMonthStr, 10) - 1;

    let sourceMonth = fromMonth;
    if (!sourceMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(sourceMonth)) {
      const prevDate = new Date(tYear, tMonth - 1, 1);
      sourceMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    }

    const [sYearStr, sMonthStr] = sourceMonth.split("-");
    const sYear = parseInt(sYearStr, 10);
    const sMonth = parseInt(sMonthStr, 10) - 1;
    const sStart = new Date(sYear, sMonth, 1, 0, 0, 0, 0);
    const sEnd = new Date(sYear, sMonth + 1, 0, 23, 59, 59, 999);

    // Fetch source month active budgets and expense transactions
    const [sourceBudgets, sourceExpenses] = await Promise.all([
      Budget.find({ month: sourceMonth, isActive: true }).lean(),
      Transaction.aggregate([
        {
          $match: {
            type: "EXPENSE",
            date: { $gte: sStart, $lte: sEnd },
          },
        },
        {
          $group: {
            _id: "$category",
            spent: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    if (!sourceBudgets || sourceBudgets.length === 0) {
      return NextResponse.json(
        { success: false, message: `No active budgets found in previous month (${sourceMonth}) to copy.` },
        { status: 404 }
      );
    }

    const spendMap = new Map<string, number>();
    sourceExpenses.forEach((item) => {
      if (item._id) {
        spendMap.set(item._id.toString(), Number(item.spent) || 0);
      }
    });

    const results = [];
    for (const b of sourceBudgets) {
      const catId = (b.category?._id || b.category).toString();
      const spent = spendMap.get(catId) || 0;
      const effectivePastLimit = Number(b.monthlyLimit) + (Number(b.rolledOverAmount) || 0);
      const unspentSurplus = Math.max(0, effectivePastLimit - spent);

      // Carry forward surplus if the budget specifically has rollover enabled, or carryForwardSurplus is requested
      const shouldRollover = Boolean(b.rolloverUnspent) && Boolean(carryForwardSurplus);
      const rolledOverAmount = shouldRollover ? unspentSurplus : 0;

      const updated = await Budget.findOneAndUpdate(
        {
          category: new mongoose.Types.ObjectId(catId),
          month: targetMonth,
        },
        {
          monthlyLimit: b.monthlyLimit,
          alertThreshold: b.alertThreshold || 80,
          rolloverUnspent: Boolean(b.rolloverUnspent),
          rolledOverAmount,
          notes: b.notes || "",
          isActive: true,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      ).populate("category", "name color icon");

      results.push(updated);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${results.length} category budgets from ${sourceMonth} to ${targetMonth}.`,
      seededCount: results.length,
      sourceMonth,
      targetMonth,
      data: results,
    });
  } catch (err: any) {
    console.error("Rollover error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process budget rollover" },
      { status: 500 }
    );
  }
}
