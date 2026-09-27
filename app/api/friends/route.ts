import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Friend from "@/models/Friend";
import FriendDue from "@/models/FriendDue";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    const friends = await Friend.find().sort({ name: 1 }).lean();

    // Aggregate unsettled dues for each friend
    const unsettledDues = await FriendDue.aggregate([
      { $match: { isSettled: false } },
      {
        $group: {
          _id: { friendId: "$friendId", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Map dues to friends
    const duesMap: Record<string, { toGive: number; toTake: number; count: number }> = {};

    unsettledDues.forEach((item) => {
      const friendId = item._id.friendId.toString();
      if (!duesMap[friendId]) {
        duesMap[friendId] = { toGive: 0, toTake: 0, count: 0 };
      }
      if (item._id.type === "TO_GIVE") {
        duesMap[friendId].toGive += item.total;
      } else if (item._id.type === "TO_TAKE") {
        duesMap[friendId].toTake += item.total;
      }
      duesMap[friendId].count += item.count;
    });

    const enrichedFriends = friends.map((friend) => {
      const dues = duesMap[friend._id.toString()] || { toGive: 0, toTake: 0, count: 0 };
      const netBalance = dues.toTake - dues.toGive; // Positive means friend owes me, negative means I owe friend
      return {
        ...friend,
        toGive: dues.toGive,
        toTake: dues.toTake,
        netBalance,
        unsettledCount: dues.count,
      };
    });

    return NextResponse.json({ success: true, data: enrichedFriends });
  } catch (error: any) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch friends" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "Friend name is required" }, { status: 400 });
    }

    const friend = await Friend.create({
      name: name.trim(),
      phone: phone?.trim() || "",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...friend.toObject(),
          toGive: 0,
          toTake: 0,
          netBalance: 0,
          unsettledCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create friend" },
      { status: 500 }
    );
  }
}
