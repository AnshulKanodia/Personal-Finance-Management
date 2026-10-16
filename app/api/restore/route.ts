import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Category from "@/models/Category";
import Friend from "@/models/Friend";
import FriendDue from "@/models/FriendDue";
import Transaction from "@/models/Transaction";
import Group from "@/models/Group";
import Budget from "@/models/Budget";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { backup, mode = "merge" } = body;

    if (!backup || typeof backup !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid backup payload. JSON object expected." },
        { status: 400 }
      );
    }

    // Extract collections data
    const rawData = backup.data || backup;
    const categories: any[] = Array.isArray(rawData.categories) ? rawData.categories : [];
    const friends: any[] = Array.isArray(rawData.friends) ? rawData.friends : [];
    const friendDues: any[] = Array.isArray(rawData.friendDues) ? rawData.friendDues : [];
    const transactions: any[] = Array.isArray(rawData.transactions) ? rawData.transactions : [];
    const groups: any[] = Array.isArray(rawData.groups) ? rawData.groups : [];
    const budgets: any[] = Array.isArray(rawData.budgets) ? rawData.budgets : [];

    if (
      categories.length === 0 &&
      friends.length === 0 &&
      friendDues.length === 0 &&
      transactions.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "The uploaded backup does not contain any valid financial records to restore.",
        },
        { status: 400 }
      );
    }

    if (mode === "replace") {
      // 1. CLEAN PURGE: Clear all existing records
      await Promise.all([
        Category.deleteMany({}),
        Friend.deleteMany({}),
        FriendDue.deleteMany({}),
        Transaction.deleteMany({}),
        Group.deleteMany({}),
        Budget.deleteMany({}),
      ]);

      // 2. Insert Category collection
      if (categories.length > 0) {
        await Category.insertMany(
          categories.map((c) => ({
            _id: c._id ? new mongoose.Types.ObjectId(c._id) : new mongoose.Types.ObjectId(),
            name: c.name,
            color: c.color || "#10b981",
            icon: c.icon || "Tag",
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          }))
        );
      }

      // 3. Insert Friend collection
      if (friends.length > 0) {
        await Friend.insertMany(
          friends.map((f) => ({
            _id: f._id ? new mongoose.Types.ObjectId(f._id) : new mongoose.Types.ObjectId(),
            name: f.name,
            phone: f.phone || "",
            createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
            updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
          }))
        );
      }

      // 4. Insert FriendDue collection
      if (friendDues.length > 0) {
        await FriendDue.insertMany(
          friendDues.map((d) => ({
            _id: d._id ? new mongoose.Types.ObjectId(d._id) : new mongoose.Types.ObjectId(),
            friendId: new mongoose.Types.ObjectId(d.friendId?._id || d.friendId),
            amount: Number(d.amount),
            type: d.type,
            isSettled: Boolean(d.isSettled),
            paymentMode: d.paymentMode || "UPI",
            notes: d.notes || "",
            date: d.date ? new Date(d.date) : new Date(),
            settledAt: d.settledAt ? new Date(d.settledAt) : undefined,
            createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
            updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
          }))
        );
      }

      // 5. Insert Transaction collection
      if (transactions.length > 0) {
        await Transaction.insertMany(
          transactions.map((t) => ({
            _id: t._id ? new mongoose.Types.ObjectId(t._id) : new mongoose.Types.ObjectId(),
            amount: Number(t.amount),
            type: t.type,
            paymentMode: t.paymentMode || "UPI",
            category: new mongoose.Types.ObjectId(t.category?._id || t.category),
            notes: t.notes || "",
            date: t.date ? new Date(t.date) : new Date(),
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
          }))
        );
      }

      // 6. Insert Groups (if present)
      if (groups.length > 0) {
        await Group.insertMany(
          groups.map((g) => ({
            _id: g._id ? new mongoose.Types.ObjectId(g._id) : new mongoose.Types.ObjectId(),
            title: g.title,
            description: g.description || "",
            status: g.status || "ACTIVE",
            members: Array.isArray(g.members)
              ? g.members.map((m: any) => ({
                  name: m.name,
                  friendId: m.friendId ? new mongoose.Types.ObjectId(m.friendId) : undefined,
                }))
              : [],
            expenses: Array.isArray(g.expenses)
              ? g.expenses.map((e: any) => ({
                  description: e.description,
                  amount: Number(e.amount),
                  paidBy: e.paidBy,
                  splitType: e.splitType || "EQUAL",
                  splitBetween: Array.isArray(e.splitBetween) ? e.splitBetween : [],
                  date: e.date ? new Date(e.date) : new Date(),
                }))
              : [],
            createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
            updatedAt: g.updatedAt ? new Date(g.updatedAt) : new Date(),
          }))
        );
      }

      // 7. Insert Budgets (if present)
      if (budgets.length > 0) {
        await Budget.insertMany(
          budgets.map((b) => ({
            _id: b._id ? new mongoose.Types.ObjectId(b._id) : new mongoose.Types.ObjectId(),
            category: new mongoose.Types.ObjectId(b.category?._id || b.category),
            monthlyLimit: Number(b.monthlyLimit),
            month: b.month,
            alertThreshold: b.alertThreshold || 80,
            isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
            notes: b.notes || "",
            createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
            updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
          }))
        );
      }

      return NextResponse.json({
        success: true,
        mode: "replace",
        message: "Vault replaced completely with backup records.",
        counts: {
          categories: categories.length,
          friends: friends.length,
          friendDues: friendDues.length,
          transactions: transactions.length,
          groups: groups.length,
          budgets: budgets.length,
        },
      });
    }

    // MERGE MODE: Non-destructive import
    const categoryIdMap = new Map<string, mongoose.Types.ObjectId>();
    const friendIdMap = new Map<string, mongoose.Types.ObjectId>();

    let restoredCategories = 0;
    let restoredFriends = 0;
    let restoredDues = 0;
    let restoredTransactions = 0;
    let restoredGroups = 0;

    // 1. Process Categories
    for (const c of categories) {
      if (!c.name) continue;
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${c.name.trim()}$`, "i") },
      });

      if (existing) {
        if (c._id) categoryIdMap.set(c._id.toString(), existing._id as mongoose.Types.ObjectId);
      } else {
        const newCat = await Category.create({
          name: c.name.trim(),
          color: c.color || "#10b981",
          icon: c.icon || "Tag",
        });
        if (c._id) categoryIdMap.set(c._id.toString(), newCat._id as mongoose.Types.ObjectId);
        restoredCategories++;
      }
    }

    // 2. Process Friends
    for (const f of friends) {
      if (!f.name) continue;
      const existing = await Friend.findOne({
        name: { $regex: new RegExp(`^${f.name.trim()}$`, "i") },
      });

      if (existing) {
        if (f._id) friendIdMap.set(f._id.toString(), existing._id as mongoose.Types.ObjectId);
      } else {
        const newFriend = await Friend.create({
          name: f.name.trim(),
          phone: f.phone || "",
        });
        if (f._id) friendIdMap.set(f._id.toString(), newFriend._id as mongoose.Types.ObjectId);
        restoredFriends++;
      }
    }

    // 3. Process Friend Dues
    for (const d of friendDues) {
      const rawFriendId = (d.friendId?._id || d.friendId)?.toString();
      const mappedFriendId = rawFriendId ? friendIdMap.get(rawFriendId) : null;

      if (!mappedFriendId) continue;

      const dueDate = d.date ? new Date(d.date) : new Date();
      // Check for duplicate due
      const existingDue = await FriendDue.findOne({
        friendId: mappedFriendId,
        amount: Number(d.amount),
        type: d.type,
        date: {
          $gte: new Date(dueDate.getTime() - 60000),
          $lte: new Date(dueDate.getTime() + 60000),
        },
      });

      if (!existingDue) {
        await FriendDue.create({
          friendId: mappedFriendId,
          amount: Number(d.amount),
          type: d.type,
          isSettled: Boolean(d.isSettled),
          paymentMode: d.paymentMode || "UPI",
          notes: d.notes || "",
          date: dueDate,
          settledAt: d.settledAt ? new Date(d.settledAt) : undefined,
        });
        restoredDues++;
      }
    }

    // 4. Process Transactions
    for (const t of transactions) {
      const rawCatId = (t.category?._id || t.category)?.toString();
      const mappedCatId = rawCatId ? categoryIdMap.get(rawCatId) : null;

      // If category wasn't mapped, fallback to first available category
      let finalCatId = mappedCatId;
      if (!finalCatId) {
        const defaultCat = await Category.findOne();
        if (defaultCat) finalCatId = defaultCat._id as mongoose.Types.ObjectId;
      }
      if (!finalCatId) continue;

      const txDate = t.date ? new Date(t.date) : new Date();
      // Check for duplicate transaction
      const existingTx = await Transaction.findOne({
        amount: Number(t.amount),
        type: t.type,
        category: finalCatId,
        date: {
          $gte: new Date(txDate.getTime() - 60000),
          $lte: new Date(txDate.getTime() + 60000),
        },
      });

      if (!existingTx) {
        await Transaction.create({
          amount: Number(t.amount),
          type: t.type,
          paymentMode: t.paymentMode || "UPI",
          category: finalCatId,
          notes: t.notes || "",
          date: txDate,
        });
        restoredTransactions++;
      }
    }

    // 5. Process Groups (if present)
    for (const g of groups) {
      if (!g.title) continue;
      const existingGroup = await Group.findOne({ title: g.title.trim() });
      if (!existingGroup) {
        await Group.create({
          title: g.title.trim(),
          description: g.description || "",
          status: g.status || "ACTIVE",
          members: Array.isArray(g.members)
            ? g.members.map((m: any) => ({
                name: m.name,
                friendId: m.friendId ? friendIdMap.get(m.friendId.toString()) : undefined,
              }))
            : [],
          expenses: Array.isArray(g.expenses)
            ? g.expenses.map((e: any) => ({
                description: e.description,
                amount: Number(e.amount),
                paidBy: e.paidBy,
                splitType: e.splitType || "EQUAL",
                splitBetween: Array.isArray(e.splitBetween) ? e.splitBetween : [],
                date: e.date ? new Date(e.date) : new Date(),
              }))
            : [],
        });
        restoredGroups++;
      }
    }

    // 6. Process Budgets (if present)
    let restoredBudgets = 0;
    for (const b of budgets) {
      if (!b.category || !b.month) continue;
      const rawCatId = (b.category?._id || b.category)?.toString();
      const mappedCatId = rawCatId ? categoryIdMap.get(rawCatId) : null;
      if (!mappedCatId) continue;

      const existingBudget = await Budget.findOne({
        category: mappedCatId,
        month: b.month,
      });

      if (!existingBudget) {
        await Budget.create({
          category: mappedCatId,
          monthlyLimit: Number(b.monthlyLimit),
          month: b.month,
          alertThreshold: b.alertThreshold || 80,
          isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
          notes: b.notes || "",
        });
        restoredBudgets++;
      }
    }

    return NextResponse.json({
      success: true,
      mode: "merge",
      message: `Vault merged: ${restoredTransactions} transactions, ${restoredFriends} friends, ${restoredDues} dues, ${restoredCategories} categories, ${restoredBudgets} budgets added.`,
      counts: {
        categories: restoredCategories,
        friends: restoredFriends,
        friendDues: restoredDues,
        transactions: restoredTransactions,
        groups: restoredGroups,
        budgets: restoredBudgets,
      },
    });
  } catch (error: any) {
    console.error("Vault restore failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to restore vault data from backup",
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
