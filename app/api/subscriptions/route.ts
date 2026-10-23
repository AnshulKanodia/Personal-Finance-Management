import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import { calculateNextDueDate, getSubscriptionStatus } from "@/lib/subscriptionEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    const subscriptions = await Subscription.find({ isActive: true })
      .populate("category", "name color icon")
      .sort({ nextDueDate: 1 })
      .lean();

    const today = new Date();
    let totalMonthlyCommitment = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;

    const enriched = subscriptions.map((sub: any) => {
      const statusInfo = getSubscriptionStatus(sub, today);

      // Normalize monthly commitment
      let monthlyRate = sub.amount;
      if (sub.billingCycle === "QUARTERLY") monthlyRate = sub.amount / 3;
      if (sub.billingCycle === "YEARLY") monthlyRate = sub.amount / 12;
      totalMonthlyCommitment += Math.round(monthlyRate);

      if (statusInfo.status === "DUE_SOON") dueSoonCount++;
      if (statusInfo.status === "OVERDUE") overdueCount++;

      return {
        ...sub,
        status: statusInfo.status,
        daysRemaining: statusInfo.daysRemaining,
        isPaidThisCycle: statusInfo.isPaidThisCycle,
        monthlyRate: Math.round(monthlyRate),
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
      meta: {
        totalMonthlyCommitment,
        activeCount: subscriptions.length,
        dueSoonCount,
        overdueCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      name,
      amount,
      billingCycle = "MONTHLY",
      dueDay = 1,
      category,
      paymentMode = "UPI",
      autoRenew = true,
      reminderDaysBefore = 3,
      notes = "",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Subscription name is required" },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid positive amount is required" },
        { status: 400 }
      );
    }

    const numDueDay = parseInt(dueDay, 10);
    if (isNaN(numDueDay) || numDueDay < 1 || numDueDay > 31) {
      return NextResponse.json(
        { success: false, message: "Due day must be between 1 and 31" },
        { status: 400 }
      );
    }

    // Auto-calculate the first nextDueDate
    const nextDueDate = calculateNextDueDate(numDueDay, billingCycle);

    const subscription = await Subscription.create({
      name: name.trim(),
      amount: numAmount,
      billingCycle,
      dueDay: numDueDay,
      category: category || undefined,
      paymentMode,
      autoRenew,
      reminderDaysBefore: parseInt(reminderDaysBefore, 10) || 3,
      notes: notes.trim(),
      nextDueDate,
      isActive: true,
    });

    const populated = await Subscription.findById(subscription._id).populate(
      "category",
      "name color icon"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Subscription created successfully",
        data: populated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create subscription" },
      { status: 500 }
    );
  }
}
