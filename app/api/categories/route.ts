import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Category from "@/models/Category";
import { DEFAULT_CATEGORIES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    let categories = await Category.find().sort({ name: 1 }).lean();

    // Auto-seed default categories if database is fresh
    if (categories.length === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      categories = await Category.find().sort({ name: 1 }).lean();
    }

    return NextResponse.json(
      { success: true, data: categories },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, color, icon } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, "i") } });
    if (existing) {
      return NextResponse.json({ success: false, message: "Category with this name already exists" }, { status: 409 });
    }

    const category = await Category.create({
      name: trimmedName,
      color: color || "#10b981",
      icon: icon || "Tag",
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
