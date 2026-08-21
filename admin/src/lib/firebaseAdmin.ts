import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin SDK singleton, used by API routes for
 * privileged operations (creating users with a specific role, verifying ID
 * tokens, generating report exports) that must never run with client-side
 * credentials. Never import this file from a "use client" component.
 */
function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Copy .env.local.example to .env.local and fill in your service account."
    );
  }

  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());
