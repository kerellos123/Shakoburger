import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, UnauthorizedError } from "@/lib/requireAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Creates a Firebase Auth user + matching `users/{uid}` Firestore profile in
 * one step. Using the Admin SDK here (instead of the client SDK, as the
 * Flutter app's fallback does) avoids signing the admin out of their own
 * session — the classic gotcha of `createUserWithEmailAndPassword` on a
 * client that's already signed in as someone else.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { email, password, fullName, phone, role, assignedServantId } = body as {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      role: "admin" | "servant" | "member";
      assignedServantId?: string;
    };

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "email, password, fullName and role are required" }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({ email, password, displayName: fullName });

    await adminDb.collection("users").doc(userRecord.uid).set({
      role,
      fullName,
      email,
      phone: phone ?? "",
      assignedServantId: assignedServantId ?? null,
      talents: [],
      fcmTokens: [],
      locale: "ar",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ uid: userRecord.uid });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
