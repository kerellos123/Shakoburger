import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:st_paul_family/features/auth/data/auth_repository.dart';

/// Thin wrapper around `firebase_messaging` that requests permission, keeps
/// the current user's FCM token in sync with their `users/{uid}` doc, and
/// exposes the stream of foreground messages for the app to react to
/// (e.g. showing an in-app banner or badge).
class PushNotificationService {
  PushNotificationService._();

  static final _messaging = FirebaseMessaging.instance;

  /// Call once at app startup, before any user is necessarily signed in.
  static Future<void> initialize() async {
    await _messaging.requestPermission(alert: true, badge: true, sound: true);
    await _messaging.setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true);
  }

  /// Call after sign-in to register this device's token against the user's
  /// profile, and keep it updated if FCM rotates the token.
  static Future<void> syncTokenForUser(String uid, AuthRepository authRepository) async {
    final token = await _messaging.getToken();
    if (token != null) {
      await authRepository.registerFcmToken(uid, token);
    }

    _messaging.onTokenRefresh.listen((newToken) {
      authRepository.registerFcmToken(uid, newToken);
    });
  }

  static Stream<RemoteMessage> get onForegroundMessage => FirebaseMessaging.onMessage;

  static Future<RemoteMessage?> get initialMessage => _messaging.getInitialMessage();

  static void debugLogTokenErrors(Object error, StackTrace stackTrace) {
    if (kDebugMode) {
      // ignore: avoid_print
      print('FCM token error: $error');
    }
  }
}
