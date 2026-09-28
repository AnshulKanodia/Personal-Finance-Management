import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category"; // Ensure model registration

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    // Ensure Category model is loaded in memory for populate
    if (!Category) {
      // noop
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // EXPENSE | INCOME
    const category = searchParams.get("category");
    const paymentMode = searchParams.get("paymentMode");
    const search = searchParams.get("search");
    const month = searchParams.get("month"); // Format: YYYY-MM
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limitParam = searchParams.get("limit");
    const isUnlimited = limitParam === "0" || limitParam === "all";
    const limit = isUnlimited ? 0 : parseInt(limitParam || "100", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const filter: Record<string, any> = {};

    if (type && ["EXPENSE", "INCOME"].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (paymentMode && ["UPI", "CASH", "CARD", "NET_BANKING"].includes(paymentMode)) {
      filter.paymentMode = paymentMode;
    }

    if (search && search.trim()) {
      filter.notes = { $regex: search.trim(), $options: "i" };
    }

    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;
      const startOfMonth = new Date(year, m, 1);
      const endOfMonth = new Date(year, m + 1, 0, 23, 59, 59, 999);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.date.$lte = e;
      }
    }

    const query = Transaction.find(filter)
      .populate("category", "name color icon")
      .sort({ date: -1, createdAt: -1 });

    if (limit > 0) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
    }

    const [transactions, totalCount] = await Promise.all([
      query.lean(),
      Transaction.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { amount, type, paymentMode, category, notes, date } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ success: false, message: "Valid positive amount is required" }, { status: 400 });
    }

    if (!type || !["EXPENSE", "INCOME"].includes(type)) {
      return NextResponse.json({ success: false, message: "Type must be EXPENSE or INCOME" }, { status: 400 });
    }

    if (!paymentMode || !["UPI", "CASH", "CARD", "NET_BANKING"].includes(paymentMode)) {
      return NextResponse.json({ success: false, message: "Valid payment mode is required" }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ success: false, message: "Category is required" }, { status: 400 });
    }

    const transaction = await Transaction.create({
      amount: Number(amount),
      type,
      paymentMode,
      category,
      notes: notes?.trim() || "",
      date: date ? new Date(date) : new Date(),
    });

    const populated = await Transaction.findById(transaction._id).populate("category", "name color icon").lean();

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create transaction" },
      { status: 500 }
    );
  }
}
