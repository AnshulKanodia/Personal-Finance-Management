import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import FriendDue from "@/models/FriendDue";
import Friend from "@/models/Friend";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { friendId, logToTracker = false, categoryId, paymentMode = "UPI" } = body;

    if (!friendId) {
      return NextResponse.json({ success: false, message: "friendId is required" }, { status: 400 });
    }

    const friend = await Friend.findById(friendId);
    if (!friend) {
      return NextResponse.json({ success: false, message: "Friend not found" }, { status: 404 });
    }

    // Get all unsettled dues for this friend
    const unsettledDues = await FriendDue.find({ friendId, isSettled: false });

    if (unsettledDues.length === 0) {
      return NextResponse.json(
        { success: false, message: "No unsettled dues found for this friend" },
        { status: 400 }
      );
    }

    // Calculate net amount
    let toGive = 0;
    let toTake = 0;

    unsettledDues.forEach((due) => {
      if (due.type === "TO_GIVE") {
        toGive += due.amount;
      } else if (due.type === "TO_TAKE") {
        toTake += due.amount;
      }
    });

    const netBalance = toTake - toGive; // > 0: friend owes me, < 0: I owe friend

    // Mark all currently unsettled dues as settled
    const now = new Date();
    await FriendDue.updateMany(
      { friendId, isSettled: false },
      { $set: { isSettled: true, settledAt: now } }
    );

    let loggedTransaction = null;

    // If user wants to log this settlement into main expense tracker
    if (logToTracker && netBalance !== 0) {
      // Find category or fallback to a category
      let targetCategoryId = categoryId;
      if (!targetCategoryId) {
        let defaultCat = await Category.findOne({
          name: { $in: ["UPI Transfers", "Other", "Freelance", "Rent & Bills"] },
        });
        if (!defaultCat) {
          defaultCat = await Category.findOne();
        }
        targetCategoryId = defaultCat?._id;
      }

      if (targetCategoryId) {
        if (netBalance > 0) {
          // Friend settled up money they owed me -> Income!
          loggedTransaction = await Transaction.create({
            amount: Math.abs(netBalance),
            type: "INCOME",
            paymentMode: paymentMode || "UPI",
            category: targetCategoryId,
            notes: `Settled dues from ${friend.name}`,
            date: now,
          });
        } else if (netBalance < 0) {
          // I settled up money I owed friend -> Expense!
          loggedTransaction = await Transaction.create({
            amount: Math.abs(netBalance),
            type: "EXPENSE",
            paymentMode: paymentMode || "UPI",
            category: targetCategoryId,
            notes: `Settled dues to ${friend.name}`,
            date: now,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully settled all dues for ${friend.name}`,
      settledCount: unsettledDues.length,
      netBalance,
      loggedTransaction,
    });
  } catch (error: any) {
    console.error("Error settling dues:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to settle dues" },
      { status: 500 }
    );
  }
}
