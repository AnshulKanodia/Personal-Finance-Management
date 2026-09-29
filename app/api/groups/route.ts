import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Group from "@/models/Group";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const groups = await Group.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: groups });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load groups" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { title, description, members } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Group title is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(members) || members.length < 2) {
      return NextResponse.json(
        { success: false, message: "A group must have at least 2 members" },
        { status: 400 }
      );
    }

    const group = await Group.create({
      title: title.trim(),
      description: (description || "").trim(),
      members: members.map((m: any) => ({
        friendId: m.friendId || undefined,
        name: m.name.trim(),
      })),
      expenses: [],
      status: "ACTIVE",
    });

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create group" },
      { status: 500 }
    );
  }
}
