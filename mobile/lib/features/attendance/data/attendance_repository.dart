import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/attendance/domain/attendance_record.dart';
import 'package:st_paul_family/features/attendance/domain/meeting.dart';

class AttendanceRepository {
  AttendanceRepository({FirebaseFirestore? firestore}) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _meetings => _firestore.collection(FirestorePaths.meetings);
  CollectionReference<Map<String, dynamic>> get _attendance => _firestore.collection(FirestorePaths.attendance);

  Stream<List<Meeting>> watchUpcomingMeetings({int limit = 10}) {
    return _meetings
        .where('startAt', isGreaterThanOrEqualTo: Timestamp.now())
        .orderBy('startAt')
        .limit(limit)
        .snapshots()
        .map((s) => s.docs.map(Meeting.fromFirestore).toList());
  }

  Stream<List<Meeting>> watchAllMeetings() {
    return _meetings.orderBy('startAt', descending: true).snapshots().map(
          (s) => s.docs.map(Meeting.fromFirestore).toList(),
        );
  }

  Future<Meeting?> findMeetingByQrCode(String qrCode) async {
    final snap = await _meetings.where('qrCode', isEqualTo: qrCode).limit(1).get();
    if (snap.docs.isEmpty) return null;
    return Meeting.fromFirestore(snap.docs.first);
  }

  Future<String> createMeeting(Meeting meeting) async {
    final doc = await _meetings.add(meeting.toMap());
    return doc.id;
  }

  /// Records or overwrites attendance for a single member at a meeting.
  /// Uses a deterministic doc id (`meetingId_memberId`) so re-marking simply
  /// updates the existing record instead of creating duplicates.
  Future<void> markAttendance({
    required String meetingId,
    required String memberId,
    required AttendanceStatus status,
    required String recordedBy,
    required AttendanceMethod method,
    String? notes,
  }) {
    final id = '${meetingId}_$memberId';
    return _attendance.doc(id).set({
      'meetingId': meetingId,
      'memberId': memberId,
      'status': status.name,
      'recordedBy': recordedBy,
      'method': method.name,
      'notes': notes,
      'recordedAt': Timestamp.now(),
    });
  }

  Stream<List<AttendanceRecord>> watchAttendanceForMeeting(String meetingId) {
    return _attendance.where('meetingId', isEqualTo: meetingId).snapshots().map(
          (s) => s.docs.map(AttendanceRecord.fromFirestore).toList(),
        );
  }

  Stream<List<AttendanceRecord>> watchAttendanceHistoryForMember(String memberId) {
    return _attendance
        .where('memberId', isEqualTo: memberId)
        .orderBy('recordedAt', descending: true)
        .snapshots()
        .map((s) => s.docs.map(AttendanceRecord.fromFirestore).toList());
  }

  Future<Map<String, dynamic>?> fetchMonthlyReport(String period) async {
    final doc = await _firestore.collection(FirestorePaths.reportsCache).doc(period).get();
    return doc.data();
  }
}
