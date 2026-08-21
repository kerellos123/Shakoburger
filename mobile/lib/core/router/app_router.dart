import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:st_paul_family/features/attendance/presentation/attendance_screen.dart';
import 'package:st_paul_family/features/attendance/presentation/qr_checkin_screen.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';
import 'package:st_paul_family/features/auth/presentation/login_screen.dart';
import 'package:st_paul_family/features/auth/presentation/register_screen.dart';
import 'package:st_paul_family/features/activities/presentation/activities_screen.dart';
import 'package:st_paul_family/features/devotionals/presentation/devotionals_screen.dart';
import 'package:st_paul_family/features/followup/presentation/followup_screen.dart';
import 'package:st_paul_family/features/home/presentation/home_shell.dart';
import 'package:st_paul_family/features/home/presentation/home_screen.dart';
import 'package:st_paul_family/features/library/presentation/library_screen.dart';
import 'package:st_paul_family/features/news/presentation/news_screen.dart';
import 'package:st_paul_family/features/notifications/presentation/notifications_screen.dart';
import 'package:st_paul_family/features/notifications/presentation/send_notification_screen.dart';
import 'package:st_paul_family/features/quizzes/presentation/leaderboard_screen.dart';
import 'package:st_paul_family/features/quizzes/presentation/quiz_play_screen.dart';
import 'package:st_paul_family/features/quizzes/presentation/quizzes_screen.dart';
import 'package:st_paul_family/features/reports/presentation/reports_screen.dart';
import 'package:st_paul_family/features/sermons/presentation/sermons_screen.dart';
import 'package:st_paul_family/features/youth/presentation/youth_detail_screen.dart';
import 'package:st_paul_family/features/youth/presentation/youth_form_screen.dart';
import 'package:st_paul_family/features/youth/presentation/youth_list_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refreshListenable = GoRouterRefreshStream(ref.watch(authRepositoryProvider).authStateChanges);
  ref.onDispose(refreshListenable.dispose);

  return GoRouter(
    initialLocation: '/home',
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final isLoggedIn = ref.read(authStateProvider).valueOrNull != null;
      final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(
        path: '/qr-checkin',
        builder: (context, state) => const QrCheckinScreen(),
      ),
      GoRoute(
        path: '/send-notification',
        builder: (context, state) => const SendNotificationScreen(),
      ),
      GoRoute(
        path: '/youth/new',
        builder: (context, state) => const YouthFormScreen(),
      ),
      GoRoute(
        path: '/youth/:id',
        builder: (context, state) => YouthDetailScreen(memberId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/quiz/:id/play',
        builder: (context, state) => QuizPlayScreen(quizId: state.pathParameters['id']!),
      ),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
          GoRoute(path: '/youth', builder: (context, state) => const YouthListScreen()),
          GoRoute(path: '/attendance', builder: (context, state) => const AttendanceScreen()),
          GoRoute(path: '/followup', builder: (context, state) => const FollowUpScreen()),
          GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
          GoRoute(path: '/sermons', builder: (context, state) => const SermonsScreen()),
          GoRoute(path: '/devotionals', builder: (context, state) => const DevotionalsScreen()),
          GoRoute(path: '/quizzes', builder: (context, state) => const QuizzesScreen()),
          GoRoute(path: '/leaderboard', builder: (context, state) => const LeaderboardScreen()),
          GoRoute(path: '/activities', builder: (context, state) => const ActivitiesScreen()),
          GoRoute(path: '/news', builder: (context, state) => const NewsScreen()),
          GoRoute(path: '/library', builder: (context, state) => const LibraryScreen()),
          GoRoute(path: '/reports', builder: (context, state) => const ReportsScreen()),
        ],
      ),
    ],
  );
});

/// Bridges a auth state [Stream] into a [Listenable] so go_router re-runs its
/// redirect logic whenever the signed-in user changes.
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
