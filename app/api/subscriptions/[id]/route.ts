import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import { calculateNextDueDate } from "@/lib/subscriptionEngine";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    const existing = await Subscription.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      );
    }

    const {
      name,
      amount,
      billingCycle,
      dueDay,
      category,
      paymentMode,
      autoRenew,
      reminderDaysBefore,
      notes,
      isActive,
    } = body;

    if (name !== undefined) existing.name = name.trim();
    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > 0) existing.amount = numAmount;
    }
    if (paymentMode !== undefined) existing.paymentMode = paymentMode;
    if (category !== undefined) existing.category = category || undefined;
    if (autoRenew !== undefined) existing.autoRenew = !!autoRenew;
    if (isActive !== undefined) existing.isActive = !!isActive;
    if (reminderDaysBefore !== undefined)
      existing.reminderDaysBefore = parseInt(reminderDaysBefore, 10) || 3;
    if (notes !== undefined) existing.notes = notes.trim();

    // Recalculate nextDueDate if dueDay or billingCycle changed
    const cycleChanged = billingCycle && billingCycle !== existing.billingCycle;
    const dayChanged = dueDay !== undefined && parseInt(dueDay, 10) !== existing.dueDay;

    if (cycleChanged || dayChanged) {
      if (billingCycle) existing.billingCycle = billingCycle;
      if (dueDay !== undefined) existing.dueDay = parseInt(dueDay, 10);
      existing.nextDueDate = calculateNextDueDate(
        existing.dueDay,
        existing.billingCycle
      );
    }

    await existing.save();

    const populated = await Subscription.findById(id).populate(
      "category",
      "name color icon"
    );

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      data: populated,
    });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    // Soft delete
    const sub = await Subscription.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!sub) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
