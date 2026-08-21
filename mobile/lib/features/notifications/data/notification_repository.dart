import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/notifications/domain/app_notification.dart';

class NotificationRepository {
  NotificationRepository({FirebaseFirestore? firestore, FirebaseFunctions? functions})
      : _firestore = firestore ?? FirebaseFirestore.instance,
        _functions = functions ?? FirebaseFunctions.instance;

  final FirebaseFirestore _firestore;
  final FirebaseFunctions _functions;

  Stream<List<AppNotification>> watchRecent({int limit = 50}) {
    return _firestore
        .collection(FirestorePaths.notifications)
        .orderBy('sentAt', descending: true)
        .limit(limit)
        .snapshots()
        .map((s) => s.docs.map(AppNotification.fromFirestore).toList());
  }

  /// Sends a push notification via the `sendNotification` callable Cloud
  /// Function, which validates the caller's role/scope server-side and fans
  /// out to the target's FCM tokens.
  Future<void> send({
    required String title,
    required String body,
    required NotificationTarget target,
    required String type,
    Map<String, String>? data,
  }) {
    return _functions.httpsCallable('sendNotification').call({
      'title': title,
      'body': body,
      'target': target.toMap(),
      'type': type,
      'data': data,
    });
  }
}
