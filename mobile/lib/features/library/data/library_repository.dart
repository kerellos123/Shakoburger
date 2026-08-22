import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/library/domain/library_item.dart';

class LibraryRepository {
  LibraryRepository({FirebaseFirestore? firestore}) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _library => _firestore.collection(FirestorePaths.library);

  Stream<List<LibraryItem>> watchByCategory(LibraryCategory? category) {
    Query<Map<String, dynamic>> query = _library.orderBy('title');
    if (category != null) query = query.where('category', isEqualTo: libraryCategoryToString(category));
    return query.snapshots().map((s) => s.docs.map(LibraryItem.fromFirestore).toList());
  }
}
