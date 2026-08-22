import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/features/auth/data/auth_repository.dart';
import 'package:st_paul_family/features/auth/domain/app_user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository());

/// Emits the signed-in Firebase uid, or null when signed out.
final authStateProvider = StreamProvider<String?>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return repo.authStateChanges.map((u) => u?.uid);
});

/// Emits the full app-level profile (role, name, etc.) for the signed-in user,
/// re-emitting live as the Firestore doc changes (e.g. role updated by admin).
final currentUserProvider = StreamProvider<AppUser?>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  final uidAsync = ref.watch(authStateProvider);

  return uidAsync.when(
    data: (uid) => uid == null ? Stream.value(null) : repo.watchUserProfile(uid),
    loading: () => Stream.value(null),
    error: (_, __) => Stream.value(null),
  );
});

class AuthController extends StateNotifier<AsyncValue<void>> {
  AuthController(this._repository) : super(const AsyncData(null));

  final AuthRepository _repository;

  Future<void> signIn(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _repository.signIn(email: email, password: password));
  }

  Future<void> registerMember({
    required String email,
    required String password,
    required String fullName,
    required String phone,
    required DateTime dateOfBirth,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _repository.registerMember(
          email: email,
          password: password,
          fullName: fullName,
          phone: phone,
          dateOfBirth: dateOfBirth,
        ));
  }

  Future<void> signOut() => _repository.signOut();
}

final authControllerProvider = StateNotifierProvider<AuthController, AsyncValue<void>>((ref) {
  return AuthController(ref.watch(authRepositoryProvider));
});
