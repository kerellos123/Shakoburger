import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

class Devotional extends Equatable {
  final String id;
  final String title;
  final String body;
  final String? imageUrl;
  final String? videoUrl;
  final DateTime date;

  const Devotional({
    required this.id,
    required this.title,
    required this.body,
    this.imageUrl,
    this.videoUrl,
    required this.date,
  });

  factory Devotional.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data()!;
    return Devotional(
      id: doc.id,
      title: d['title'] ?? '',
      body: d['body'] ?? '',
      imageUrl: d['imageUrl'],
      videoUrl: d['videoUrl'],
      date: (d['date'] as Timestamp).toDate(),
    );
  }

  @override
  List<Object?> get props => [id, title, date];
}
