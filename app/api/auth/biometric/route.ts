import { NextRequest, NextResponse } from "next/server";
import { checkPin, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || !checkPin(pin)) {
      return NextResponse.json(
        { success: false, message: "Valid 6-digit PIN required to enable biometrics" },
        { status: 401 }
      );
    }

    // Generate a long-lived biometric token
    const biometricToken = await createSessionToken();

    return NextResponse.json({
      success: true,
      biometricToken,
      message: "Biometrics successfully registered",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Biometric registration failed" },
      { status: 500 }
    );
  }
}
