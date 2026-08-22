import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

class NewsItem extends Equatable {
  final String id;
  final String title;
  final String body;
  final List<String> imageUrls;
  final String? videoUrl;
  final DateTime publishedAt;

  const NewsItem({
    required this.id,
    required this.title,
    required this.body,
    this.imageUrls = const [],
    this.videoUrl,
    required this.publishedAt,
  });

  factory NewsItem.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data()!;
    return NewsItem(
      id: doc.id,
      title: d['title'] ?? '',
      body: d['body'] ?? '',
      imageUrls: List<String>.from(d['imageUrls'] ?? const []),
      videoUrl: d['videoUrl'],
      publishedAt: (d['publishedAt'] as Timestamp).toDate(),
    );
  }

  @override
  List<Object?> get props => [id, title, publishedAt];
}
