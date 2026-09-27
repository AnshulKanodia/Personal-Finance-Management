import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import "@/models/Category";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 });
    }

    if (body.amount !== undefined) transaction.amount = Number(body.amount);
    if (body.type !== undefined) transaction.type = body.type;
    if (body.paymentMode !== undefined) transaction.paymentMode = body.paymentMode;
    if (body.category !== undefined) transaction.category = body.category;
    if (body.notes !== undefined) transaction.notes = body.notes.trim();
    if (body.date !== undefined) transaction.date = new Date(body.date);

    await transaction.save();

    const updated = await Transaction.findById(id).populate("category", "name color icon").lean();
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Transaction deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
