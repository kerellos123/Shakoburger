import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/sermons/domain/sermon.dart';

class SermonRepository {
  SermonRepository({FirebaseFirestore? firestore}) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _sermons => _firestore.collection(FirestorePaths.sermons);

  Stream<List<Sermon>> watchAll({String? speaker, String? topic}) {
    Query<Map<String, dynamic>> query = _sermons.orderBy('date', descending: true);
    if (speaker != null) query = query.where('speaker', isEqualTo: speaker);
    if (topic != null) query = query.where('topic', isEqualTo: topic);
    return query.snapshots().map((s) => s.docs.map(Sermon.fromFirestore).toList());
  }

  Stream<List<Sermon>> watchRecent({int limit = 5}) {
    return _sermons.orderBy('date', descending: true).limit(limit).snapshots().map(
          (s) => s.docs.map(Sermon.fromFirestore).toList(),
        );
  }

  Future<void> create(Map<String, dynamic> data) => _sermons.add(data);
}
