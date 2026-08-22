import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";

/**
 * Maintains the top-level `leaderboard/{uid}` doc whenever a quiz attempt is
 * written, so clients can render a leaderboard with a single cheap query
 * instead of aggregating across every quiz's attempts subcollection.
 */
export const onQuizAttemptWritten = onDocumentWritten(
  "quizzes/{quizId}/attempts/{uid}",
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();
    if (!after) return;

    const uid = event.params.uid;
    const scoreDelta = (after.score ?? 0) - (before?.score ?? 0);
    const completedDelta = before ? 0 : 1;

    const leaderboardRef = db.collection("leaderboard").doc(uid);
    await leaderboardRef.set(
      {
        totalPoints: FieldValue.increment(scoreDelta),
        quizzesCompleted: FieldValue.increment(completedDelta),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
);
