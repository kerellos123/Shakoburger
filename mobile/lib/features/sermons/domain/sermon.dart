import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum SermonMediaType { video, audio, pdf, youtube }

SermonMediaType sermonMediaTypeFromString(String value) => SermonMediaType.values.firstWhere(
      (t) => t.name == value,
      orElse: () => SermonMediaType.youtube,
    );

class Sermon extends Equatable {
  final String id;
  final String title;
  final String speaker;
  final String topic;
  final DateTime date;
  final SermonMediaType mediaType;
  final String mediaUrl;
  final String? thumbnailUrl;

  const Sermon({
    required this.id,
    required this.title,
    required this.speaker,
    required this.topic,
    required this.date,
    required this.mediaType,
    required this.mediaUrl,
    this.thumbnailUrl,
  });

  factory Sermon.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data()!;
    return Sermon(
      id: doc.id,
      title: d['title'] ?? '',
      speaker: d['speaker'] ?? '',
      topic: d['topic'] ?? '',
      date: (d['date'] as Timestamp).toDate(),
      mediaType: sermonMediaTypeFromString(d['mediaType'] ?? 'youtube'),
      mediaUrl: d['mediaUrl'] ?? '',
      thumbnailUrl: d['thumbnailUrl'],
    );
  }

  @override
  List<Object?> get props => [id, title, speaker, date];
}
