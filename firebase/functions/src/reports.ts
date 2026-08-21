import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./admin";

async function buildMonthlyReport(year: number, month: number) {
  const start = Timestamp.fromDate(new Date(year, month - 1, 1));
  const end = Timestamp.fromDate(new Date(year, month, 1));

  const attendanceSnap = await db
    .collection("attendance")
    .where("recordedAt", ">=", start)
    .where("recordedAt", "<", end)
    .get();

  const byMember: Record<string, { present: number; absent: number; excused: number; late: number }> = {};
  const meetingIds = new Set<string>();

  for (const doc of attendanceSnap.docs) {
    const { memberId, status, meetingId } = doc.data();
    meetingIds.add(meetingId);
    byMember[memberId] ??= { present: 0, absent: 0, excused: 0, late: 0 };
    byMember[memberId][status as "present" | "absent" | "excused" | "late"] += 1;
  }

  const totalMeetings = meetingIds.size;
  const memberIds = Object.keys(byMember);
  const avgAttendancePercent =
    memberIds.length === 0 || totalMeetings === 0
      ? 0
      : (memberIds.reduce((sum, id) => {
          const m = byMember[id];
          const attended = m.present + m.late;
          return sum + attended / totalMeetings;
        }, 0) /
          memberIds.length) *
        100;

  const period = `${year}-${String(month).padStart(2, "0")}`;

  await db
    .collection("reportsCache")
    .doc(period)
    .set({
      totalMeetings,
      avgAttendancePercent,
      byMember,
      generatedAt: FieldValue.serverTimestamp(),
    });

  return period;
}

/** Rebuilds last month's report every night; cheap enough to run daily and self-heals from late attendance edits. */
export const rebuildMonthlyReport = onSchedule(
  { schedule: "30 2 * * *", timeZone: "Africa/Cairo" },
  async () => {
    const now = new Date();
    await buildMonthlyReport(now.getFullYear(), now.getMonth() + 1);
  }
);

/** Lets the admin dashboard force a rebuild for an arbitrary month (e.g. to generate historical reports on demand). */
export const rebuildReportForPeriod = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const callerDoc = await db.collection("users").doc(uid).get();
  if (callerDoc.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admins only.");
  }

  const { year, month } = request.data as { year: number; month: number };
  if (!year || !month) throw new HttpsError("invalid-argument", "year and month are required.");

  const period = await buildMonthlyReport(year, month);
  return { period };
});
