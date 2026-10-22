import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import { advanceDueDateAfterPayment } from "@/lib/subscriptionEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { notes, customAmount } = body;

    const sub = await Subscription.findById(id);
    if (!sub || !sub.isActive) {
      return NextResponse.json(
        { success: false, message: "Active subscription not found" },
        { status: 404 }
      );
    }

    const payAmount =
      customAmount && !isNaN(parseFloat(customAmount))
        ? parseFloat(customAmount)
        : sub.amount;

    // Resolve category or fallback
    let targetCategory = sub.category;
    if (!targetCategory) {
      const defaultSubCat = await Category.findOne({
        name: { $in: ["Subscriptions", "Bills & Utilities", "Entertainment", "Other"] },
      });
      targetCategory = defaultSubCat?._id;
    }

    const now = new Date();

    // 1. Log transaction into Transaction collection
    const transaction = await Transaction.create({
      amount: payAmount,
      type: "EXPENSE",
      category: targetCategory,
      paymentMode: sub.paymentMode || "UPI",
      notes: notes?.trim() || `Subscription paid: ${sub.name}`,
      date: now,
    });

    // 2. Advance nextDueDate to next billing cycle and update lastPaidAt
    const nextDueDate = advanceDueDateAfterPayment(
      sub.nextDueDate,
      sub.dueDay,
      sub.billingCycle
    );

    sub.lastPaidAt = now;
    sub.nextDueDate = nextDueDate;
    await sub.save();

    const populated = await Subscription.findById(id).populate(
      "category",
      "name color icon"
    );

    return NextResponse.json({
      success: true,
      message: `Successfully logged payment for ${sub.name} and advanced due date`,
      data: {
        subscription: populated,
        transaction,
      },
    });
  } catch (error: any) {
    console.error("Error processing subscription payment:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}
