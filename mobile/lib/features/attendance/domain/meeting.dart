import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum MeetingType { weekly, monthly, special, conference, trip, service, event }

MeetingType meetingTypeFromString(String value) => MeetingType.values.firstWhere(
      (t) => t.name == value,
      orElse: () => MeetingType.weekly,
    );

class Meeting extends Equatable {
  final String id;
  final String title;
  final String? description;
  final MeetingType type;
  final DateTime startAt;
  final DateTime? endAt;
  final String? location;
  final String qrCode;
  final String createdBy;

  const Meeting({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    required this.startAt,
    this.endAt,
    this.location,
    required this.qrCode,
    required this.createdBy,
  });

  factory Meeting.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data()!;
    return Meeting(
      id: doc.id,
      title: data['title'] ?? '',
      description: data['description'],
      type: meetingTypeFromString(data['type'] ?? 'weekly'),
      startAt: (data['startAt'] as Timestamp).toDate(),
      endAt: (data['endAt'] as Timestamp?)?.toDate(),
      location: data['location'],
      qrCode: data['qrCode'] ?? '',
      createdBy: data['createdBy'] ?? '',
    );
  }

  Map<String, dynamic> toMap() => {
        'title': title,
        'description': description,
        'type': type.name,
        'startAt': Timestamp.fromDate(startAt),
        'endAt': endAt != null ? Timestamp.fromDate(endAt!) : null,
        'location': location,
        'qrCode': qrCode,
        'createdBy': createdBy,
      };

  @override
  List<Object?> get props => [id, title, type, startAt];
}
