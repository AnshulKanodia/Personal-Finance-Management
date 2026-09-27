import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import FriendDue from "@/models/FriendDue";
import Friend from "@/models/Friend"; // Ensure model registration

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    if (!Friend) {
      // noop to ensure model registration
    }

    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get("friendId");
    const type = searchParams.get("type"); // TO_GIVE | TO_TAKE
    const isSettled = searchParams.get("isSettled");

    const filter: Record<string, any> = {};

    if (friendId) filter.friendId = friendId;
    if (type) filter.type = type;
    if (isSettled !== null && isSettled !== undefined) {
      filter.isSettled = isSettled === "true";
    }

    const dues = await FriendDue.find(filter)
      .populate("friendId", "name phone")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: dues });
  } catch (error: any) {
    console.error("Error fetching dues:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch dues" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { friendId, amount, type, paymentMode, notes, date } = body;

    if (!friendId) {
      return NextResponse.json({ success: false, message: "Friend is required" }, { status: 400 });
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ success: false, message: "Valid positive amount is required" }, { status: 400 });
    }

    if (!type || !["TO_GIVE", "TO_TAKE"].includes(type)) {
      return NextResponse.json({ success: false, message: "Type must be TO_GIVE or TO_TAKE" }, { status: 400 });
    }

    const due = await FriendDue.create({
      friendId,
      amount: Number(amount),
      type,
      paymentMode: paymentMode || "UPI",
      notes: notes?.trim() || "",
      date: date ? new Date(date) : new Date(),
      isSettled: false,
    });

    const populated = await FriendDue.findById(due._id).populate("friendId", "name phone").lean();

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create due entry" },
      { status: 500 }
    );
  }
}
