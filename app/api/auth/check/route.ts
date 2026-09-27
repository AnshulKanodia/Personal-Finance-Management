import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated(req);
  return NextResponse.json({ authenticated: authed });
}
