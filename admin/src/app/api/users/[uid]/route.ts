import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, UnauthorizedError } from "@/lib/requireAdmin";

export async function PATCH(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    await requireAdmin(request);
    const updates = await request.json();
    await adminDb.collection("users").doc(params.uid).update(updates);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    await requireAdmin(request);
    await adminAuth.deleteUser(params.uid);
    await adminDb.collection("users").doc(params.uid).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
