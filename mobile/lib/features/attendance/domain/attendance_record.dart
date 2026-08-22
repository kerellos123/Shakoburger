import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum AttendanceStatus { present, absent, excused, late }

AttendanceStatus attendanceStatusFromString(String value) => AttendanceStatus.values.firstWhere(
      (s) => s.name == value,
      orElse: () => AttendanceStatus.absent,
    );

enum AttendanceMethod { manual, qr }

class AttendanceRecord extends Equatable {
  final String id;
  final String meetingId;
  final String memberId;
  final AttendanceStatus status;
  final String recordedBy;
  final AttendanceMethod method;
  final String? notes;
  final DateTime recordedAt;

  const AttendanceRecord({
    required this.id,
    required this.meetingId,
    required this.memberId,
    required this.status,
    required this.recordedBy,
    required this.method,
    this.notes,
    required this.recordedAt,
  });

  factory AttendanceRecord.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data()!;
    return AttendanceRecord(
      id: doc.id,
      meetingId: data['meetingId'] ?? '',
      memberId: data['memberId'] ?? '',
      status: attendanceStatusFromString(data['status'] ?? 'absent'),
      recordedBy: data['recordedBy'] ?? '',
      method: (data['method'] ?? 'manual') == 'qr' ? AttendanceMethod.qr : AttendanceMethod.manual,
      notes: data['notes'],
      recordedAt: (data['recordedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() => {
        'meetingId': meetingId,
        'memberId': memberId,
        'status': status.name,
        'recordedBy': recordedBy,
        'method': method.name,
        'notes': notes,
        'recordedAt': Timestamp.fromDate(recordedAt),
      };

  @override
  List<Object?> get props => [id, meetingId, memberId, status, recordedAt];
}
