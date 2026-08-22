import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum LibraryCategory { bible, dailyReading, hymn, song, book, article, qa }

LibraryCategory libraryCategoryFromString(String value) => switch (value) {
      'bible' => LibraryCategory.bible,
      'daily_reading' => LibraryCategory.dailyReading,
      'hymn' => LibraryCategory.hymn,
      'song' => LibraryCategory.song,
      'book' => LibraryCategory.book,
      'article' => LibraryCategory.article,
      'qa' => LibraryCategory.qa,
      _ => LibraryCategory.article,
    };

String libraryCategoryToString(LibraryCategory category) => switch (category) {
      LibraryCategory.bible => 'bible',
      LibraryCategory.dailyReading => 'daily_reading',
      LibraryCategory.hymn => 'hymn',
      LibraryCategory.song => 'song',
      LibraryCategory.book => 'book',
      LibraryCategory.article => 'article',
      LibraryCategory.qa => 'qa',
    };

class LibraryItem extends Equatable {
  final String id;
  final String title;
  final LibraryCategory category;
  final String? body;
  final String? fileUrl;

  const LibraryItem({
    required this.id,
    required this.title,
    required this.category,
    this.body,
    this.fileUrl,
  });

  factory LibraryItem.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data()!;
    return LibraryItem(
      id: doc.id,
      title: d['title'] ?? '',
      category: libraryCategoryFromString(d['category'] ?? 'article'),
      body: d['body'],
      fileUrl: d['fileUrl'],
    );
  }

  @override
  List<Object?> get props => [id, title, category];
}
