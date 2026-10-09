import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import FriendDue from "@/models/FriendDue";
import "@/models/Friend"; // Ensure Friend model is registered

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    const due = await FriendDue.findById(id);
    if (!due) {
      return NextResponse.json({ success: false, message: "Due record not found" }, { status: 404 });
    }

    if (body.amount !== undefined) {
      const numAmount = Number(body.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ success: false, message: "Amount must be a positive number" }, { status: 400 });
      }
      due.amount = numAmount;
    }

    if (body.type !== undefined) {
      if (!["TO_GIVE", "TO_TAKE"].includes(body.type)) {
        return NextResponse.json({ success: false, message: "Type must be TO_GIVE or TO_TAKE" }, { status: 400 });
      }
      due.type = body.type;
    }

    if (body.paymentMode !== undefined) {
      due.paymentMode = body.paymentMode;
    }

    if (body.friendId !== undefined) {
      due.friendId = body.friendId;
    }

    if (body.notes !== undefined) {
      due.notes = body.notes.trim();
    }

    if (body.date !== undefined) {
      due.date = new Date(body.date);
    }

    if (body.isSettled !== undefined) {
      due.isSettled = Boolean(body.isSettled);
      if (body.isSettled && !due.settledAt) {
        due.settledAt = new Date();
      } else if (!body.isSettled) {
        due.settledAt = undefined;
      }
    }

    await due.save();

    const updated = await FriendDue.findById(id).populate("friendId", "name phone").lean();
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update due record" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const deleted = await FriendDue.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Due record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Due record deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete due record" },
      { status: 500 }
    );
  }
}
