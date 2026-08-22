import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum ActivityType { trip, conference, sports, camp, volunteer, event }

ActivityType activityTypeFromString(String value) => ActivityType.values.firstWhere(
      (t) => t.name == value,
      orElse: () => ActivityType.event,
    );

class Activity extends Equatable {
  final String id;
  final String title;
  final ActivityType type;
  final String? description;
  final DateTime startAt;
  final DateTime? endAt;
  final int? capacity;

  const Activity({
    required this.id,
    required this.title,
    required this.type,
    this.description,
    required this.startAt,
    this.endAt,
    this.capacity,
  });

  factory Activity.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data()!;
    return Activity(
      id: doc.id,
      title: d['title'] ?? '',
      type: activityTypeFromString(d['type'] ?? 'event'),
      description: d['description'],
      startAt: (d['startAt'] as Timestamp).toDate(),
      endAt: (d['endAt'] as Timestamp?)?.toDate(),
      capacity: d['capacity'],
    );
  }

  @override
  List<Object?> get props => [id, title, startAt];
}
