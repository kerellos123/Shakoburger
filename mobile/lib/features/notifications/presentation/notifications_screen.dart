import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/notifications/presentation/notification_providers.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  IconData _iconFor(String type) => switch (type) {
        'meeting_reminder' => Icons.event_outlined,
        'service' => Icons.church_outlined,
        'conference' => Icons.groups_outlined,
        'trip' => Icons.directions_bus_outlined,
        'sermon' => Icons.play_circle_outline,
        'devotional' => Icons.menu_book_outlined,
        'birthday' => Icons.cake_outlined,
        _ => Icons.notifications_outlined,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(recentNotificationsProvider);

    return AsyncValueWidget(
      value: notificationsAsync,
      data: (notifications) {
        if (notifications.isEmpty) return const Center(child: Text('No notifications yet.'));

        return ListView.separated(
          itemCount: notifications.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final n = notifications[index];
            return ListTile(
              leading: Icon(_iconFor(n.type)),
              title: Text(n.title),
              subtitle: Text(n.body),
              trailing: Text(
                '${n.sentAt.hour.toString().padLeft(2, '0')}:${n.sentAt.minute.toString().padLeft(2, '0')}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            );
          },
        );
      },
    );
  }
}
