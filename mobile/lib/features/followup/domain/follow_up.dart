import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

class FollowUpNote extends Equatable {
  final String text;
  final String authorId;
  final DateTime createdAt;

  const FollowUpNote({required this.text, required this.authorId, required this.createdAt});

  factory FollowUpNote.fromMap(Map<String, dynamic> map) => FollowUpNote(
        text: map['text'] ?? '',
        authorId: map['authorId'] ?? '',
        createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      );

  Map<String, dynamic> toMap() => {
        'text': text,
        'authorId': authorId,
        'createdAt': Timestamp.fromDate(createdAt),
      };

  @override
  List<Object?> get props => [text, authorId, createdAt];
}

/// Mirrors `followUps/{memberId}`. Mostly maintained server-side by the
/// `onAttendanceWrite` Cloud Function; the client updates the servant-facing
/// fields (calls, visits, notes, spiritual status).
class FollowUp extends Equatable {
  final String memberId;
  final String? servantId;
  final DateTime? lastAttendanceAt;
  final int consecutiveAbsences;
  final DateTime? lastPhoneCallAt;
  final DateTime? lastVisitAt;
  final String? spiritualStatus;
  final List<FollowUpNote> notes;

  const FollowUp({
    required this.memberId,
    this.servantId,
    this.lastAttendanceAt,
    this.consecutiveAbsences = 0,
    this.lastPhoneCallAt,
    this.lastVisitAt,
    this.spiritualStatus,
    this.notes = const [],
  });

  factory FollowUp.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data()!;
    return FollowUp(
      memberId: data['memberId'] ?? doc.id,
      servantId: data['servantId'],
      lastAttendanceAt: (data['lastAttendanceAt'] as Timestamp?)?.toDate(),
      consecutiveAbsences: data['consecutiveAbsences'] ?? 0,
      lastPhoneCallAt: (data['lastPhoneCallAt'] as Timestamp?)?.toDate(),
      lastVisitAt: (data['lastVisitAt'] as Timestamp?)?.toDate(),
      spiritualStatus: data['spiritualStatus'],
      notes: ((data['notes'] as List?) ?? [])
          .map((n) => FollowUpNote.fromMap(Map<String, dynamic>.from(n)))
          .toList(),
    );
  }

  @override
  List<Object?> get props => [memberId, consecutiveAbsences, lastAttendanceAt, spiritualStatus];
}
