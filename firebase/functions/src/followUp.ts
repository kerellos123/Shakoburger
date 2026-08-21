import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";

/** Notify a servant after this many consecutive absences by their assigned member. */
const ABSENCE_ALERT_THRESHOLD = 3;

/**
 * Keeps `followUps/{memberId}` in sync whenever an attendance record is
 * created or updated, and raises an automated notification to the member's
 * servant once consecutive absences cross the threshold.
 */
export const onAttendanceWrite = onDocumentWritten("attendance/{attendanceId}", async (event) => {
  const after = event.data?.after?.data();
  if (!after) return; // deletion, nothing to recompute here

  const memberId = after.memberId as string;
  const status = after.status as "present" | "absent" | "excused" | "late";
  const recordedAt = (after.recordedAt as Timestamp) ?? Timestamp.now();

  const memberDoc = await db.collection("users").doc(memberId).get();
  const servantId = memberDoc.data()?.assignedServantId as string | undefined;

  const followUpRef = db.collection("followUps").doc(memberId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(followUpRef);
    const existing = snap.exists ? snap.data()! : { consecutiveAbsences: 0 };

    const isAbsence = status === "absent";
    const consecutiveAbsences = isAbsence ? (existing.consecutiveAbsences ?? 0) + 1 : 0;

    const update: Record<string, unknown> = {
      memberId,
      servantId: servantId ?? null,
      consecutiveAbsences,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status === "present" || status === "late") {
      update.lastAttendanceAt = recordedAt;
    }

    tx.set(followUpRef, update, { merge: true });
  });

  if (isAbsenceThresholdCrossed(status)) {
    const updated = await followUpRef.get();
    const consecutiveAbsences = updated.data()?.consecutiveAbsences ?? 0;

    if (servantId && consecutiveAbsences === ABSENCE_ALERT_THRESHOLD) {
      await db.collection("notifications").add({
        title: "Follow-up needed",
        body: `${memberDoc.data()?.fullName ?? "A member"} has missed ${consecutiveAbsences} meetings in a row.`,
        type: "general",
        target: { scope: "servant", servantId },
        sentByFunction: true,
        sentAt: FieldValue.serverTimestamp(),
        data: { screen: "followUp", id: memberId },
      });
    }
  }

  function isAbsenceThresholdCrossed(s: string) {
    return s === "absent";
  }
});
