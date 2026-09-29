import { NextRequest, NextResponse } from "next/server";
import { checkPin, createSessionToken, verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, biometricToken } = body;

    let isValid = false;

    if (biometricToken) {
      isValid = await verifyToken(biometricToken);
      if (!isValid) {
        return NextResponse.json({ success: false, message: "Invalid biometric token" }, { status: 401 });
      }
    } else if (pin) {
      isValid = checkPin(pin);
      if (!isValid) {
        return NextResponse.json({ success: false, message: "Invalid PIN code" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ success: false, message: "PIN or biometric token is required" }, { status: 400 });
    }

    const token = await createSessionToken();

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Authentication error" },
      { status: 500 }
    );
  }
}
