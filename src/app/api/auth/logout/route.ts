import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
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
