# St. Paul the Apostle Family — Firestore Database Schema

All collections are top-level unless noted. Timestamps are Firestore `Timestamp`. IDs are Firestore auto-IDs unless noted.

## `users/{uid}`
Mirrors Firebase Auth user, adds app-specific profile + role.

| Field | Type | Notes |
|---|---|---|
| uid | string | == Firebase Auth UID |
| role | string | `admin` \| `servant` \| `member` |
| fullName | string | |
| photoUrl | string? | Storage URL |
| phone | string | |
| email | string | |
| dateOfBirth | Timestamp | |
| school | string? | school/university |
| job | string? | |
| address | string? | |
| church | string? | |
| assignedServantId | string? | uid of servant, members only |
| talents | string[] | |
| notes | string? | free text, servant/admin only visible |
| familyInfo | map? | `{ fatherName, motherName, siblings, familyPhone }` |
| emergencyContact | map? | `{ name, phone, relation }` |
| spiritualStatus | string? | e.g. `active`, `needs_followup`, `inactive` |
| fcmTokens | string[] | for push notifications, multiple devices |
| locale | string | `ar` \| `en` |
| createdAt | Timestamp | |
| updatedAt | Timestamp | |

Subcollection: `users/{uid}/favorites/{devotionalId}` — favorited devotionals.

## `meetings/{meetingId}`

| Field | Type | Notes |
|---|---|---|
| title | string | |
| description | string? | |
| type | string | `weekly` \| `monthly` \| `special` \| `conference` \| `trip` \| `service` \| `event` |
| startAt | Timestamp | |
| endAt | Timestamp? | |
| location | string? | |
| qrCode | string | unique token used for QR attendance check-in |
| createdBy | string | uid |
| createdAt | Timestamp | |

## `attendance/{attendanceId}`
One doc per (meeting, member).

| Field | Type | Notes |
|---|---|---|
| meetingId | string | ref |
| memberId | string | uid |
| status | string | `present` \| `absent` \| `excused` \| `late` |
| recordedBy | string | uid of servant/admin, or `self` for QR check-in |
| method | string | `manual` \| `qr` |
| notes | string? | |
| recordedAt | Timestamp | |

Composite indexes: `(memberId, recordedAt desc)`, `(meetingId, status)`.

## `followUps/{followUpId}`
One doc per member, updated by Cloud Functions + servants.

| Field | Type | Notes |
|---|---|---|
| memberId | string | |
| servantId | string | |
| lastAttendanceAt | Timestamp? | |
| consecutiveAbsences | number | reset to 0 on `present`/`late` |
| lastPhoneCallAt | Timestamp? | |
| lastVisitAt | Timestamp? | |
| spiritualStatus | string | |
| notes | array<map> | `{ text, authorId, createdAt }` append-only log |
| updatedAt | Timestamp | |

Cloud Function `onAttendanceWrite` recalculates `consecutiveAbsences`/`lastAttendanceAt` and triggers a notification to `servantId` when `consecutiveAbsences >= 3` (configurable).

## `notifications/{notificationId}`

| Field | Type | Notes |
|---|---|---|
| title | string | |
| body | string | |
| type | string | `meeting_reminder` \| `service` \| `conference` \| `trip` \| `sermon` \| `devotional` \| `birthday` \| `general` |
| target | map | `{ scope: 'all'\|'group'\|'servant'\|'member', groupId?, servantId?, memberId? }` |
| sentBy | string | uid |
| sentAt | Timestamp | |
| data | map? | deep-link payload (e.g. `{ screen, id }`) |

## `sermons/{sermonId}`

| Field | Type | Notes |
|---|---|---|
| title | string | |
| speaker | string | |
| topic | string | |
| date | Timestamp | |
| mediaType | string | `video` \| `audio` \| `pdf` \| `youtube` |
| mediaUrl | string | Storage URL or YouTube link |
| thumbnailUrl | string? | |
| createdAt | Timestamp | |

## `devotionals/{devotionalId}`

| Field | Type | Notes |
|---|---|---|
| title | string | |
| body | string | text (supports simple markdown) |
| imageUrl | string? | |
| videoUrl | string? | |
| date | Timestamp | one devotional per day |
| createdAt | Timestamp | |

## `quizzes/{quizId}`

| Field | Type | Notes |
|---|---|---|
| title | string | |
| category | string | |
| questions | array<map> | `{ type, question, options?, correctAnswer, points }`; `type` in `multiple_choice`\|`true_false`\|`fill_blank`\|`verse_completion` |
| isActive | boolean | |
| createdAt | Timestamp | |

Subcollection: `quizzes/{quizId}/attempts/{uid}` — `{ score, answers, completedAt }`.

Top-level `leaderboard/{uid}` — `{ totalPoints, quizzesCompleted, rank }` maintained by Cloud Function on attempt write.

## `activities/{activityId}`

| Field | Type | Notes |
|---|---|---|
| title | string | |
| type | string | `trip` \| `conference` \| `sports` \| `camp` \| `volunteer` \| `event` |
| description | string? | |
| startAt | Timestamp | |
| endAt | Timestamp? | |
| capacity | number? | |
| registrations | string[] | uids, or use subcollection if capacity is large |
| createdAt | Timestamp | |

Subcollection: `activities/{activityId}/registrations/{uid}` — `{ registeredAt, status }` (preferred over array for scale).

## `news/{newsId}`

| Field | Type | Notes |
|---|---|---|
| title | string | |
| body | string | |
| imageUrls | string[] | |
| videoUrl | string? | |
| publishedAt | Timestamp | |
| createdBy | string | uid |

## `library/{itemId}`
Spiritual library: hymns, songs, books, articles, Q&A.

| Field | Type | Notes |
|---|---|---|
| title | string | |
| category | string | `bible` \| `daily_reading` \| `hymn` \| `song` \| `book` \| `article` \| `qa` |
| body | string? | |
| fileUrl | string? | Storage URL (PDF/audio) |
| createdAt | Timestamp | |

## Reports (derived, not stored)
Attendance %, most active members, frequent absences, and monthly/yearly stats are computed via Cloud Functions aggregation (`reportsCache/{period}`) refreshed nightly by a scheduled function, to avoid expensive client-side aggregation queries.

`reportsCache/{yyyy-mm}` — `{ totalMeetings, avgAttendancePercent, byMember: { [uid]: { present, absent, excused, late } }, generatedAt }`.

## Security model summary
- `admin`: full read/write on all collections.
- `servant`: read all youth profiles; write attendance/followUps/notes only for members where `assignedServantId == servant.uid` (or any member if explicitly granted); read-only on meetings/sermons/etc.
- `member`: read own `users/{uid}` doc + public content (meetings, sermons, devotionals, quizzes, activities, news, library); write own quiz attempts, activity registrations, favorites, and FCM token; read own attendance/followUp records only.

See `firebase/firestore.rules` for the enforced implementation.
