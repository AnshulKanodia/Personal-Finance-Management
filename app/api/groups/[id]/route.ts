import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Group from "@/models/Group";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const group = await Group.findById(params.id).lean();
    if (!group) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: group });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load group" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { title, description, status } = body;

    const group = await Group.findById(params.id);
    if (!group) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    if (title) group.title = title.trim();
    if (description !== undefined) group.description = description.trim();
    if (status) group.status = status;

    await group.save();
    return NextResponse.json({ success: true, data: group });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update group" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const group = await Group.findByIdAndDelete(params.id);
    if (!group) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Group deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete group" },
      { status: 500 }
    );
  }
}
