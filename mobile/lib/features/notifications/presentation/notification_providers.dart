import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/features/notifications/data/notification_repository.dart';
import 'package:st_paul_family/features/notifications/domain/app_notification.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) => NotificationRepository());

final recentNotificationsProvider = StreamProvider<List<AppNotification>>((ref) {
  return ref.watch(notificationRepositoryProvider).watchRecent();
});
