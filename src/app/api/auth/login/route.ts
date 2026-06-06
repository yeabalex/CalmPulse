import { NextResponse } from "next/server";
import { getCalmPulseDb } from "@/lib/mongodb";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = await getCalmPulseDb();

    // Find user
    const user = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password
    const passwordCheck = verifyPassword(password, user.passwordHash);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (passwordCheck.needsRehash) {
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { passwordHash: hashPassword(password) } }
      );
    }

    await createSession({ userId: user._id.toString(), email: user.email, name: user.name });

    return NextResponse.json({
      message: "Login successful",
      userId: user._id.toString(),
      name: user.name,
      onboardingComplete: user.onboardingComplete
    });
  } catch (error: any) {
    console.error("Error in login API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
