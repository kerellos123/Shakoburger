import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export class UnauthorizedError extends Error {}

/**
 * Verifies the bearer ID token on an API request and confirms the caller's
 * Firestore `users/{uid}.role` is `admin`. Throws `UnauthorizedError`
 * otherwise, which route handlers should turn into a 401/403 response.
 */
export async function requireAdmin(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!token) throw new UnauthorizedError("Missing bearer token");

  const decoded = await adminAuth.verifyIdToken(token);
  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();

  if (userDoc.data()?.role !== "admin") {
    throw new UnauthorizedError("Admin role required");
  }

  return decoded.uid;
}
