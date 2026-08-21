# API Reference

There is no standalone REST API — the mobile app talks to Firestore/Storage/FCM
directly (secured by `firebase/firestore.rules` and `firebase/storage.rules`), and both
the mobile app and admin dashboard call a small set of Cloud Functions for operations
that need to run with elevated privileges or fan out to many users. The admin
dashboard additionally has a couple of Next.js API routes for privileged operations
that must never run with client-side credentials.

## Cloud Functions (`firebase/functions/src`)

### `sendNotification` (callable)

Sends a push notification and logs it to `notifications/`.

**Request**
```ts
{
  title: string;
  body: string;
  type: string; // "general" | "meeting_reminder" | "service" | "conference" | "trip" | "sermon" | "devotional" | "birthday"
  target: {
    scope: "all" | "group" | "servant" | "member";
    groupId?: string;
    servantId?: string;
    memberId?: string;
  };
  data?: Record<string, string>; // optional deep-link payload
}
```

**Response**
```ts
{ successCount: number; failureCount: number }
```

**Authorization**: caller must be signed in with `role: "admin"` or `role: "servant"`.
Servants may only target `scope: "member"` for their own assigned members, or
`scope: "servant"` targeting themselves. Admins may use any scope.

**Errors**: `unauthenticated` (not signed in), `permission-denied` (role/scope
mismatch), `invalid-argument` (missing fields).

---

### `rebuildReportForPeriod` (callable)

Forces a rebuild of `reportsCache/{yyyy-mm}` for an arbitrary month (e.g. to backfill
historical reports on demand instead of waiting for the nightly job).

**Request**: `{ year: number; month: number }`
**Response**: `{ period: string }` (e.g. `"2026-08"`)
**Authorization**: `role: "admin"` only.

---

### Background triggers (no direct API surface)

| Function | Trigger | Behavior |
|---|---|---|
| `onNotificationCreated` | `onCreate` on `notifications/{id}` | Only acts on docs with `sentByFunction: true` (i.e. written by another function, not by `sendNotification`); resolves the target and sends the push. |
| `onAttendanceWrite` | `onWrite` on `attendance/{id}` | Recomputes `followUps/{memberId}.consecutiveAbsences` / `lastAttendanceAt`; writes an automated notification to the member's servant once absences hit 3 in a row. |
| `sendBirthdayGreetings` | scheduled, daily 07:00 Africa/Cairo | Notifies every user whose `dateOfBirth` matches today. |
| `onQuizAttemptWritten` | `onWrite` on `quizzes/{quizId}/attempts/{uid}` | Increments `leaderboard/{uid}.totalPoints` / `.quizzesCompleted`. |
| `rebuildMonthlyReport` | scheduled, nightly 02:30 Africa/Cairo | Rebuilds the current month's `reportsCache` doc from `attendance`. |

## Admin dashboard API routes (`admin/src/app/api`)

All routes require an `Authorization: Bearer <Firebase ID token>` header and verify
`role: "admin"` server-side via `src/lib/requireAdmin.ts` — a valid ID token alone is
not sufficient.

### `POST /api/users`

Creates a Firebase Auth user + `users/{uid}` Firestore profile in one step, using the
Admin SDK so it doesn't disturb the calling admin's own session (the classic problem
with creating a second user from a signed-in client SDK).

**Body**: `{ email, password, fullName, phone?, role: "admin"|"servant"|"member", assignedServantId? }`
**Response**: `{ uid: string }`

### `PATCH /api/users/[uid]`

Partially updates a `users/{uid}` document (e.g. `{ role: "servant" }` or
`{ assignedServantId: "..." }`).

### `DELETE /api/users/[uid]`

Deletes both the Firebase Auth account and the Firestore profile.

### `GET /api/reports/export`

**Query params**: `period` (e.g. `2026-08`, defaults to current month), `format`
(`xlsx` | `pdf`, defaults to `xlsx`).

Streams back a generated file built from `reportsCache/{period}` (`Content-Disposition:
attachment`). Returns `404` if that period hasn't been generated yet — see
`rebuildReportForPeriod` above.

## Firestore data contracts

See [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) for the full collection-by-collection
field reference that both the mobile app and admin dashboard read/write against
directly.
