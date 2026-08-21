import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/features/auth/domain/app_user.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';
import 'package:st_paul_family/features/youth/data/youth_repository.dart';

final youthRepositoryProvider = Provider<YouthRepository>((ref) => YouthRepository());

/// Members visible to the current user: all of them for admins, only the
/// servant's own assignees for servants. Mirrors the Firestore security rules.
final visibleMembersProvider = StreamProvider<List<AppUser>>((ref) {
  final repo = ref.watch(youthRepositoryProvider);
  final user = ref.watch(currentUserProvider).valueOrNull;

  if (user == null) return const Stream.empty();
  if (user.role == UserRole.servant) return repo.watchAssignedMembers(user.uid);
  return repo.watchAllMembers();
});

final memberProvider = StreamProvider.family((ref, String uid) {
  return ref.watch(youthRepositoryProvider).watchMember(uid);
});

final servantsProvider = StreamProvider<List<AppUser>>((ref) {
  return ref.watch(youthRepositoryProvider).watchServants();
});
