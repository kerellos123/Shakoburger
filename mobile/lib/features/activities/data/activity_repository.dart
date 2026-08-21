import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/activities/domain/activity.dart';

class ActivityRepository {
  ActivityRepository({FirebaseFirestore? firestore}) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _activities => _firestore.collection(FirestorePaths.activities);

  Stream<List<Activity>> watchUpcoming() {
    return _activities
        .where('startAt', isGreaterThanOrEqualTo: Timestamp.now())
        .orderBy('startAt')
        .snapshots()
        .map((s) => s.docs.map(Activity.fromFirestore).toList());
  }

  Stream<int> watchRegistrationCount(String activityId) {
    return _activities
        .doc(activityId)
        .collection(FirestorePaths.registrationsSubcollection)
        .snapshots()
        .map((s) => s.docs.length);
  }

  Stream<bool> watchIsRegistered(String activityId, String uid) {
    return _activities
        .doc(activityId)
        .collection(FirestorePaths.registrationsSubcollection)
        .doc(uid)
        .snapshots()
        .map((d) => d.exists);
  }

  Future<void> register(String activityId, String uid) {
    return _activities.doc(activityId).collection(FirestorePaths.registrationsSubcollection).doc(uid).set({
      'registeredAt': Timestamp.now(),
      'status': 'confirmed',
    });
  }

  Future<void> unregister(String activityId, String uid) {
    return _activities.doc(activityId).collection(FirestorePaths.registrationsSubcollection).doc(uid).delete();
  }
}
