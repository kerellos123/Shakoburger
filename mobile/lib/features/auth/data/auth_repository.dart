import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/auth/domain/app_user.dart';

class AuthRepository {
  AuthRepository({fb.FirebaseAuth? auth, FirebaseFirestore? firestore})
      : _auth = auth ?? fb.FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance;

  final fb.FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  Stream<fb.User?> get authStateChanges => _auth.authStateChanges();

  fb.User? get currentFirebaseUser => _auth.currentUser;

  Future<AppUser?> signIn({required String email, required String password}) async {
    final credential = await _auth.signInWithEmailAndPassword(email: email, password: password);
    final uid = credential.user?.uid;
    if (uid == null) return null;
    return fetchUserProfile(uid);
  }

  /// Registers a new youth member account. Servants/admins are created out-of-band
  /// (via the admin dashboard using the Firebase Admin SDK) to keep role
  /// assignment out of client hands.
  Future<AppUser> registerMember({
    required String email,
    required String password,
    required String fullName,
    required String phone,
    required DateTime dateOfBirth,
  }) async {
    final credential = await _auth.createUserWithEmailAndPassword(email: email, password: password);
    final uid = credential.user!.uid;

    final user = AppUser(
      uid: uid,
      role: UserRole.member,
      fullName: fullName,
      phone: phone,
      email: email,
      dateOfBirth: dateOfBirth,
    );

    await _firestore.collection(FirestorePaths.users).doc(uid).set({
      ...user.toMap(),
      'createdAt': FieldValue.serverTimestamp(),
    });

    return user;
  }

  Future<AppUser?> fetchUserProfile(String uid) async {
    final doc = await _firestore.collection(FirestorePaths.users).doc(uid).get();
    if (!doc.exists) return null;
    return AppUser.fromFirestore(doc);
  }

  Stream<AppUser?> watchUserProfile(String uid) {
    return _firestore.collection(FirestorePaths.users).doc(uid).snapshots().map(
          (doc) => doc.exists ? AppUser.fromFirestore(doc) : null,
        );
  }

  Future<void> sendPasswordResetEmail(String email) {
    return _auth.sendPasswordResetEmail(email: email);
  }

  Future<void> signOut() => _auth.signOut();

  Future<void> registerFcmToken(String uid, String token) {
    return _firestore.collection(FirestorePaths.users).doc(uid).update({
      'fcmTokens': FieldValue.arrayUnion([token]),
    });
  }
}
