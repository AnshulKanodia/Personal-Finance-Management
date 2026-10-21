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
    const {
      friendId,
      amount,
      settleType = "FULL",
      logToTracker = false,
      categoryId,
      paymentMode = "UPI",
      notes,
    } = body;

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
    const absNet = Math.abs(netBalance);
    const now = new Date();

    // Determine if this is a partial settlement
    const parsedAmount = typeof amount === "number" ? Math.round(amount * 100) / 100 : null;
    const isPartial =
      settleType === "PARTIAL" &&
      parsedAmount !== null &&
      parsedAmount > 0 &&
      parsedAmount < absNet;

    let loggedTransaction = null;
    let newDue = null;

    // Resolve category if logToTracker is true
    let targetCategoryId = categoryId;
    if (logToTracker && netBalance !== 0) {
      if (!targetCategoryId) {
        let defaultCat = await Category.findOne({
          name: { $in: ["UPI Transfers", "Other", "Freelance", "Rent & Bills"] },
        });
        if (!defaultCat) {
          defaultCat = await Category.findOne();
        }
        targetCategoryId = defaultCat?._id;
      }
    }

    if (isPartial && parsedAmount) {
      // 1. Partial Settlement: create a balancing payment entry
      const partialType = netBalance > 0 ? "TO_GIVE" : "TO_TAKE";
      const defaultNote =
        notes?.trim() ||
        (netBalance > 0
          ? `Partial settlement from ${friend.name} (${paymentMode})`
          : `Partial settlement to ${friend.name} (${paymentMode})`);

      newDue = await FriendDue.create({
        friendId,
        amount: parsedAmount,
        type: partialType,
        paymentMode: paymentMode || "UPI",
        notes: defaultNote,
        date: now,
        isSettled: false,
      });

      // 2. Log partial payment to main expense tracker if requested
      if (logToTracker && targetCategoryId) {
        if (netBalance > 0) {
          loggedTransaction = await Transaction.create({
            amount: parsedAmount,
            type: "INCOME",
            paymentMode: paymentMode || "UPI",
            category: targetCategoryId,
            notes: defaultNote,
            date: now,
          });
        } else {
          loggedTransaction = await Transaction.create({
            amount: parsedAmount,
            type: "EXPENSE",
            paymentMode: paymentMode || "UPI",
            category: targetCategoryId,
            notes: defaultNote,
            date: now,
          });
        }
      }

      const remainingBalance = Math.round((absNet - parsedAmount) * 100) / 100;

      return NextResponse.json({
        success: true,
        message: `Successfully logged partial settlement of ₹${parsedAmount}. Remaining balance: ₹${remainingBalance}`,
        settleType: "PARTIAL",
        settledAmount: parsedAmount,
        previousBalance: absNet,
        remainingBalance,
        newDue,
        loggedTransaction,
      });
    }

    // 2. Full Settlement: mark all currently unsettled dues as settled
    await FriendDue.updateMany(
      { friendId, isSettled: false },
      { $set: { isSettled: true, settledAt: now } }
    );

    // If user wants to log full settlement into main expense tracker
    if (logToTracker && netBalance !== 0 && targetCategoryId) {
      if (netBalance > 0) {
        loggedTransaction = await Transaction.create({
          amount: absNet,
          type: "INCOME",
          paymentMode: paymentMode || "UPI",
          category: targetCategoryId,
          notes: notes?.trim() || `Full settlement from ${friend.name}`,
          date: now,
        });
      } else if (netBalance < 0) {
        loggedTransaction = await Transaction.create({
          amount: absNet,
          type: "EXPENSE",
          paymentMode: paymentMode || "UPI",
          category: targetCategoryId,
          notes: notes?.trim() || `Full settlement to ${friend.name}`,
          date: now,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully settled all dues for ${friend.name}`,
      settleType: "FULL",
      settledAmount: absNet,
      previousBalance: absNet,
      remainingBalance: 0,
      settledCount: unsettledDues.length,
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
