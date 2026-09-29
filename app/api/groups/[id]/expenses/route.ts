import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Group from "@/models/Group";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { description, amount, paidBy, splitType, splitBetween, date } = body;

    const numericAmount = Number(amount);
    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, message: "Expense description is required" },
        { status: 400 }
      );
    }
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid amount greater than 0 is required" },
        { status: 400 }
      );
    }
    if (!paidBy) {
      return NextResponse.json(
        { success: false, message: "Paid By member is required" },
        { status: 400 }
      );
    }

    const group = await Group.findById(params.id);
    if (!group) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    const newExpense = {
      description: description.trim(),
      amount: numericAmount,
      paidBy: paidBy.trim(),
      splitType: splitType || "EQUAL",
      splitBetween: splitBetween || [],
      date: date ? new Date(date) : new Date(),
    };

    group.expenses.push(newExpense);
    await group.save();

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add expense" },
      { status: 500 }
    );
  }
}
