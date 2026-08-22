import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db, messaging } from "./admin";

export type NotificationTarget =
  | { scope: "all" }
  | { scope: "group"; groupId: string }
  | { scope: "servant"; servantId: string }
  | { scope: "member"; memberId: string };

/** Resolves a notification target into a list of user document IDs to notify. */
async function resolveTargetUserIds(target: NotificationTarget): Promise<string[]> {
  switch (target.scope) {
    case "all": {
      const snap = await db.collection("users").select().get();
      return snap.docs.map((d) => d.id);
    }
    case "group": {
      const snap = await db
        .collection("users")
        .where("groupId", "==", target.groupId)
        .select()
        .get();
      return snap.docs.map((d) => d.id);
    }
    case "servant":
      return [target.servantId];
    case "member":
      return [target.memberId];
  }
}

async function sendToUserIds(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (userIds.length === 0) return { successCount: 0, failureCount: 0 };

  const tokens: string[] = [];
  const chunks = chunk(userIds, 10); // Firestore `in` limit
  for (const c of chunks) {
    const snap = await db
      .collection("users")
      .where("__name__", "in", c)
      .get();
    for (const doc of snap.docs) {
      const t = (doc.data().fcmTokens ?? []) as string[];
      tokens.push(...t);
    }
  }

  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: data ?? {},
  });
  return { successCount: response.successCount, failureCount: response.failureCount };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Callable used by the Flutter app / admin dashboard to send a push notification.
 * Firestore rules already restrict who can *create* a `notifications` doc;
 * this function additionally verifies the caller's role server-side before fan-out.
 */
export const sendNotification = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const callerDoc = await db.collection("users").doc(uid).get();
  const role = callerDoc.data()?.role;
  if (role !== "admin" && role !== "servant") {
    throw new HttpsError("permission-denied", "Only admins and servants can send notifications.");
  }

  const { title, body, target, type, data } = request.data as {
    title: string;
    body: string;
    target: NotificationTarget;
    type: string;
    data?: Record<string, string>;
  };

  if (!title || !body || !target) {
    throw new HttpsError("invalid-argument", "title, body and target are required.");
  }

  // Servants may only target their own assigned members or themselves.
  if (role === "servant") {
    if (target.scope === "all" || target.scope === "group") {
      throw new HttpsError("permission-denied", "Servants can only notify their own members.");
    }
    if (target.scope === "member") {
      const memberDoc = await db.collection("users").doc(target.memberId).get();
      if (memberDoc.data()?.assignedServantId !== uid) {
        throw new HttpsError("permission-denied", "Not your assigned member.");
      }
    }
  }

  const userIds = await resolveTargetUserIds(target);
  const result = await sendToUserIds(userIds, title, body, data);

  await db.collection("notifications").add({
    title,
    body,
    type,
    target,
    sentBy: uid,
    sentAt: new Date(),
    data: data ?? null,
  });

  return result;
});

/**
 * Fan-out trigger: any doc written directly into `notifications` (e.g. by an
 * automated Cloud Function like follow-up alerts or birthday reminders)
 * still results in a push being sent, mirroring the callable's behavior.
 */
export const onNotificationCreated = onDocumentCreated("notifications/{notificationId}", async (event) => {
  const data = event.data?.data();
  if (!data || data.sentByFunction !== true) return; // avoid double-send for sendNotification-created docs

  const userIds = await resolveTargetUserIds(data.target as NotificationTarget);
  await sendToUserIds(userIds, data.title, data.body, data.data);
});
