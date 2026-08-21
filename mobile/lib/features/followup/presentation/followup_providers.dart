import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/features/followup/data/followup_repository.dart';

final followUpRepositoryProvider = Provider<FollowUpRepository>((ref) => FollowUpRepository());

final followUpProvider = StreamProvider.family((ref, String memberId) {
  return ref.watch(followUpRepositoryProvider).watchFollowUp(memberId);
});

final servantFollowUpsProvider = StreamProvider.family((ref, String servantId) {
  return ref.watch(followUpRepositoryProvider).watchFollowUpsForServant(servantId);
});
