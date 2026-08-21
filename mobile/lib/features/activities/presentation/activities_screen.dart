import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/activities/data/activity_repository.dart';
import 'package:st_paul_family/features/activities/domain/activity.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';

final activityRepositoryProvider = Provider<ActivityRepository>((ref) => ActivityRepository());

final upcomingActivitiesProvider = StreamProvider<List<Activity>>((ref) => ref.watch(activityRepositoryProvider).watchUpcoming());

class ActivitiesScreen extends ConsumerWidget {
  const ActivitiesScreen({super.key});

  IconData _iconFor(ActivityType type) => switch (type) {
        ActivityType.trip => Icons.directions_bus_outlined,
        ActivityType.conference => Icons.groups_outlined,
        ActivityType.sports => Icons.sports_soccer_outlined,
        ActivityType.camp => Icons.forest_outlined,
        ActivityType.volunteer => Icons.volunteer_activism_outlined,
        ActivityType.event => Icons.celebration_outlined,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activitiesAsync = ref.watch(upcomingActivitiesProvider);
    final uid = ref.watch(currentUserProvider).valueOrNull?.uid;

    return AsyncValueWidget(
      value: activitiesAsync,
      data: (activities) {
        if (activities.isEmpty) return const Center(child: Text('No upcoming activities.'));

        return ListView.builder(
          itemCount: activities.length,
          itemBuilder: (context, index) {
            final activity = activities[index];
            final registeredAsync = uid == null
                ? const AsyncValue.data(false)
                : ref.watch(_isRegisteredProvider((activityId: activity.id, uid: uid)));

            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: ListTile(
                leading: CircleAvatar(child: Icon(_iconFor(activity.type))),
                title: Text(activity.title),
                subtitle: Text(
                  '${activity.type.name} • ${activity.startAt.toString().split(' ').first}'
                  '${activity.description != null ? '\n${activity.description}' : ''}',
                ),
                isThreeLine: activity.description != null,
                trailing: uid == null
                    ? null
                    : registeredAsync.when(
                        data: (registered) => FilledButton(
                          onPressed: () => registered
                              ? ref.read(activityRepositoryProvider).unregister(activity.id, uid)
                              : ref.read(activityRepositoryProvider).register(activity.id, uid),
                          child: Text(registered ? 'Cancel' : 'Register'),
                        ),
                        loading: () => const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
              ),
            );
          },
        );
      },
    );
  }
}

final _isRegisteredProvider = StreamProvider.family<bool, ({String activityId, String uid})>((ref, params) {
  return ref.watch(activityRepositoryProvider).watchIsRegistered(params.activityId, params.uid);
});
