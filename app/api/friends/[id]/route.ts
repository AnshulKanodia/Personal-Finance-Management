import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Friend from "@/models/Friend";
import FriendDue from "@/models/FriendDue";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();
    const { name, phone } = body;

    const friend = await Friend.findById(id);
    if (!friend) {
      return NextResponse.json({ success: false, message: "Friend not found" }, { status: 404 });
    }

    if (name) friend.name = name.trim();
    if (phone !== undefined) friend.phone = phone.trim();

    await friend.save();

    return NextResponse.json({ success: true, data: friend });
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
