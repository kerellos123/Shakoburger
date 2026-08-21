import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/followup/domain/follow_up.dart';

class FollowUpRepository {
  FollowUpRepository({FirebaseFirestore? firestore}) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _followUps => _firestore.collection(FirestorePaths.followUps);

  Stream<FollowUp?> watchFollowUp(String memberId) {
    return _followUps.doc(memberId).snapshots().map((d) => d.exists ? FollowUp.fromFirestore(d) : null);
  }

  Stream<List<FollowUp>> watchFollowUpsForServant(String servantId) {
    return _followUps
        .where('servantId', isEqualTo: servantId)
        .orderBy('consecutiveAbsences', descending: true)
        .snapshots()
        .map((s) => s.docs.map(FollowUp.fromFirestore).toList());
  }

  Future<void> recordPhoneCall(String memberId) {
    return _followUps.doc(memberId).set({'lastPhoneCallAt': Timestamp.now()}, SetOptions(merge: true));
  }

  Future<void> recordVisit(String memberId) {
    return _followUps.doc(memberId).set({'lastVisitAt': Timestamp.now()}, SetOptions(merge: true));
  }

  Future<void> updateSpiritualStatus(String memberId, String status) {
    return _followUps.doc(memberId).set({'spiritualStatus': status}, SetOptions(merge: true));
  }

  Future<void> addNote(String memberId, String text, String authorId) {
    return _followUps.doc(memberId).set({
      'notes': FieldValue.arrayUnion([
        {'text': text, 'authorId': authorId, 'createdAt': Timestamp.now()}
      ]),
    }, SetOptions(merge: true));
  }
}
