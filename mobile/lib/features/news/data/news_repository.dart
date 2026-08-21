import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/news/domain/news_item.dart';

class NewsRepository {
  NewsRepository({FirebaseFirestore? firestore}) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _news => _firestore.collection(FirestorePaths.news);

  Stream<List<NewsItem>> watchAll({int limit = 50}) {
    return _news.orderBy('publishedAt', descending: true).limit(limit).snapshots().map(
          (s) => s.docs.map(NewsItem.fromFirestore).toList(),
        );
  }

  Stream<List<NewsItem>> watchRecent({int limit = 5}) => watchAll(limit: limit);
}
