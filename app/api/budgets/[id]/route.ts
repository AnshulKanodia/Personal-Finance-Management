import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Budget from "@/models/Budget";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid budget ID" },
        { status: 400 }
      );
    }

    const deleted = await Budget.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Budget record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category budget removed successfully",
    });
  } catch (error: any) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete budget" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid budget ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { monthlyLimit, alertThreshold, notes, isActive } = body;

    const updates: Record<string, any> = {};

    if (monthlyLimit !== undefined) {
      const limitNum = Number(monthlyLimit);
      if (isNaN(limitNum) || limitNum <= 0) {
        return NextResponse.json(
          { success: false, message: "Monthly limit must be greater than zero" },
          { status: 400 }
        );
      }
      updates.monthlyLimit = limitNum;
    }

    if (alertThreshold !== undefined) {
      updates.alertThreshold = Math.min(100, Math.max(10, Number(alertThreshold) || 80));
    }

    if (notes !== undefined) {
      updates.notes = String(notes).trim();
    }

    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    }

    const updated = await Budget.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("category", "name color icon");

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Budget record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Budget updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update budget" },
      { status: 500 }
    );
  }
}
