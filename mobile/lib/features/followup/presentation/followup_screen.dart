import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/auth/domain/app_user.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';
import 'package:st_paul_family/features/followup/presentation/followup_providers.dart';
import 'package:st_paul_family/features/youth/presentation/youth_providers.dart';

/// Servant/admin worklist: members ranked by consecutive absences, so the
/// people most in need of a call or visit surface first.
class FollowUpScreen extends ConsumerWidget {
  const FollowUpScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider).valueOrNull;
    if (user == null) return const SizedBox.shrink();

    final followUpsAsync = ref.watch(servantFollowUpsProvider(user.uid));
    final membersAsync = ref.watch(visibleMembersProvider);

    return AsyncValueWidget(
      value: membersAsync,
      data: (members) {
        final membersById = {for (final m in members) m.uid: m};

        return AsyncValueWidget(
          value: followUpsAsync,
          data: (followUps) {
            if (followUps.isEmpty) return const Center(child: Text('No follow-up records yet.'));

            return ListView.builder(
              itemCount: followUps.length,
              itemBuilder: (context, index) {
                final followUp = followUps[index];
                final member = membersById[followUp.memberId];

                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: ListTile(
                    title: Text(member?.fullName ?? followUp.memberId),
                    subtitle: Text(
                      'Consecutive absences: ${followUp.consecutiveAbsences}'
                      '${followUp.spiritualStatus != null ? ' • ${followUp.spiritualStatus}' : ''}',
                    ),
                    leading: CircleAvatar(
                      backgroundColor: followUp.consecutiveAbsences >= 3 ? Colors.red.shade100 : null,
                      child: Text('${followUp.consecutiveAbsences}'),
                    ),
                    trailing: Wrap(
                      spacing: 4,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.phone_outlined),
                          tooltip: 'Log phone call',
                          onPressed: () => ref.read(followUpRepositoryProvider).recordPhoneCall(followUp.memberId),
                        ),
                        IconButton(
                          icon: const Icon(Icons.home_outlined),
                          tooltip: 'Log visit',
                          onPressed: () => ref.read(followUpRepositoryProvider).recordVisit(followUp.memberId),
                        ),
                        IconButton(
                          icon: const Icon(Icons.note_add_outlined),
                          tooltip: 'Add note',
                          onPressed: () => _showAddNoteDialog(context, ref, followUp.memberId, user.uid),
                        ),
                      ],
                    ),
                    onTap: () => context.push('/youth/${followUp.memberId}'),
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  Future<void> _showAddNoteDialog(BuildContext context, WidgetRef ref, String memberId, String authorId) async {
    final controller = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add follow-up note'),
        content: TextField(controller: controller, maxLines: 3, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
        ],
      ),
    );

    if (result == true && controller.text.trim().isNotEmpty) {
      await ref.read(followUpRepositoryProvider).addNote(memberId, controller.text.trim(), authorId);
    }
  }
}
