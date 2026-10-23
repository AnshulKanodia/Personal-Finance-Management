import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Friend from "@/models/Friend";
import FriendDue from "@/models/FriendDue";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();
    const { name, phone, upiId, notes } = body;

    const friend = await Friend.findById(id);
    if (!friend) {
      return NextResponse.json({ success: false, message: "Friend not found" }, { status: 404 });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, message: "Friend name cannot be empty" },
          { status: 400 }
        );
      }
      friend.name = trimmedName;
    }

    if (phone !== undefined) {
      friend.phone = phone.trim();
    }

    if (upiId !== undefined) {
      friend.upiId = upiId.trim();
    }

    if (notes !== undefined) {
      friend.notes = notes.trim();
    }

    await friend.save();

    // Fetch unsettled dues summary for this friend
    const unsettledDues = await FriendDue.find({ friendId: id, isSettled: false });
    let toGive = 0;
    let toTake = 0;
    unsettledDues.forEach((d) => {
      if (d.type === "TO_GIVE") toGive += d.amount;
      else if (d.type === "TO_TAKE") toTake += d.amount;
    });

    const netBalance = toTake - toGive;

    return NextResponse.json({
      success: true,
      data: {
        ...friend.toObject(),
        toGive,
        toTake,
        netBalance,
        unsettledCount: unsettledDues.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update friend" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const deleted = await Friend.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Friend not found" }, { status: 404 });
    }

    // Also remove associated dues
    await FriendDue.deleteMany({ friendId: id });

    return NextResponse.json({ success: true, message: "Friend and associated records deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete friend" },
      { status: 500 }
    );
  }
}
