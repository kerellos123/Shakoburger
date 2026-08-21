import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/devotionals/domain/devotional.dart';

class DevotionalRepository {
  DevotionalRepository({FirebaseFirestore? firestore}) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _devotionals => _firestore.collection(FirestorePaths.devotionals);

  Stream<List<Devotional>> watchAll() {
    return _devotionals.orderBy('date', descending: true).snapshots().map(
          (s) => s.docs.map(Devotional.fromFirestore).toList(),
        );
  }

  Stream<Devotional?> watchToday() {
    final startOfDay = DateTime.now();
    final start = Timestamp.fromDate(DateTime(startOfDay.year, startOfDay.month, startOfDay.day));
    final end = Timestamp.fromDate(DateTime(startOfDay.year, startOfDay.month, startOfDay.day + 1));

    return _devotionals
        .where('date', isGreaterThanOrEqualTo: start)
        .where('date', isLessThan: end)
        .limit(1)
        .snapshots()
        .map((s) => s.docs.isEmpty ? null : Devotional.fromFirestore(s.docs.first));
  }

  Future<void> toggleFavorite(String uid, String devotionalId, bool isFavorite) {
    final ref = _firestore
        .collection(FirestorePaths.users)
        .doc(uid)
        .collection(FirestorePaths.favoritesSubcollection)
        .doc(devotionalId);
    return isFavorite ? ref.set({'favoritedAt': Timestamp.now()}) : ref.delete();
  }

  Stream<Set<String>> watchFavoriteIds(String uid) {
    return _firestore
        .collection(FirestorePaths.users)
        .doc(uid)
        .collection(FirestorePaths.favoritesSubcollection)
        .snapshots()
        .map((s) => s.docs.map((d) => d.id).toSet());
  }
}
