import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { createSession, hashPassword, toSafeUser, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calmpulse");
    const user = await db.collection("users").findOne({ email: String(email).toLowerCase() });

    if (!user || typeof user.passwordHash !== "string") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const verification = verifyPassword(String(password), user.passwordHash);

    if (!verification.valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (verification.needsRehash) {
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { passwordHash: hashPassword(String(password)) } }
      );
    }

    await createSession({
      userId: user._id.toString(),
      email: typeof user.email === "string" ? user.email : "",
      name: typeof user.name === "string" ? user.name : ""
    });

    return NextResponse.json({
      message: "Logged in successfully",
      user: toSafeUser(user)
    });
  } catch (error: unknown) {
    console.error("Error in login API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
