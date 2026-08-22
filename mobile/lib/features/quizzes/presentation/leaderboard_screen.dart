import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/quizzes/presentation/quiz_providers.dart';
import 'package:st_paul_family/features/youth/presentation/youth_providers.dart';

class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(leaderboardProvider);
    final membersAsync = ref.watch(visibleMembersProvider);

    return AsyncValueWidget(
      value: leaderboardAsync,
      data: (entries) {
        if (entries.isEmpty) return const Center(child: Text('No quiz attempts yet.'));
        final membersById = {for (final m in membersAsync.valueOrNull ?? []) m.uid: m};

        return ListView.builder(
          itemCount: entries.length,
          itemBuilder: (context, index) {
            final entry = entries[index];
            final member = membersById[entry.uid];

            return ListTile(
              leading: CircleAvatar(child: Text('${index + 1}')),
              title: Text(member?.fullName ?? entry.uid),
              subtitle: Text('${entry.quizzesCompleted} quizzes completed'),
              trailing: Text('${entry.totalPoints} pts', style: Theme.of(context).textTheme.titleMedium),
            );
          },
        );
      },
    );
  }
}
