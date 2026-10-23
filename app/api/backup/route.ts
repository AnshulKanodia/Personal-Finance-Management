import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Category from "@/models/Category";
import Friend from "@/models/Friend";
import FriendDue from "@/models/FriendDue";
import Transaction from "@/models/Transaction";
import Group from "@/models/Group";
import Budget from "@/models/Budget";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Fetch all collections in parallel
    const [categories, friends, friendDues, transactions, groups, budgets] = await Promise.all([
      Category.find().lean(),
      Friend.find().lean(),
      FriendDue.find().lean(),
      Transaction.find().lean(),
      Group.find().lean(),
      Budget.find().lean(),
    ]);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `RupeePulse_Vault_Backup_${timestamp}.json`;

    const backupPayload = {
      app: "RupeePulse",
      version: "1.5.0",
      format: "RupeePulse-Vault-Backup-v1",
      exportedAt: new Date().toISOString(),
      counts: {
        categories: categories.length,
        friends: friends.length,
        friendDues: friendDues.length,
        transactions: transactions.length,
        groups: groups.length,
        budgets: budgets.length,
      },
      data: {
        categories,
        friends,
        friendDues,
        transactions,
        groups,
        budgets,
      },
    };

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Backup export failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate vault backup archive",
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
