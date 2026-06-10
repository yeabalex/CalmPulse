import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { applyRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "auth:logout",
    limit: 240,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    const cookieStore = await cookies();
    cookieStore.delete("calmpulse_session");
    
    return NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error: any) {
    console.error("Error in logout API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
