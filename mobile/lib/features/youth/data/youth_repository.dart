import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/auth/domain/app_user.dart';

/// Manages `users` documents where `role == member` — i.e. the youth roster.
/// Admin roles see everyone; servants are scoped to their assigned members by
/// the caller (see [watchAssignedMembers]), matching the Firestore rules.
class YouthRepository {
  YouthRepository({FirebaseFirestore? firestore}) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _users => _firestore.collection(FirestorePaths.users);

  Stream<List<AppUser>> watchAllMembers() {
    return _users.where('role', isEqualTo: 'member').orderBy('fullName').snapshots().map(
          (s) => s.docs.map(AppUser.fromFirestore).toList(),
        );
  }

  Stream<List<AppUser>> watchAssignedMembers(String servantId) {
    return _users
        .where('role', isEqualTo: 'member')
        .where('assignedServantId', isEqualTo: servantId)
        .orderBy('fullName')
        .snapshots()
        .map((s) => s.docs.map(AppUser.fromFirestore).toList());
  }

  Stream<AppUser?> watchMember(String uid) {
    return _users.doc(uid).snapshots().map((d) => d.exists ? AppUser.fromFirestore(d) : null);
  }

  Future<void> updateMember(String uid, Map<String, dynamic> data) {
    return _users.doc(uid).update(data);
  }

  Stream<List<AppUser>> watchServants() {
    return _users.where('role', isEqualTo: 'servant').orderBy('fullName').snapshots().map(
          (s) => s.docs.map(AppUser.fromFirestore).toList(),
        );
  }
}
