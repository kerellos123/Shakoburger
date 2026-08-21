import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:st_paul_family/core/localization/generated/app_localizations.dart';
import 'package:st_paul_family/features/auth/domain/app_user.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';

class _NavItem {
  final String label;
  final IconData icon;
  final String route;
  final Set<UserRole> visibleTo;

  const _NavItem(this.label, this.icon, this.route, this.visibleTo);
}

/// Wraps every authenticated screen with a shared app bar + role-aware
/// navigation drawer. Individual screens are rendered as [child].
class HomeShell extends ConsumerWidget {
  const HomeShell({required this.child, super.key});

  final Widget child;

  static const _allRoles = {UserRole.admin, UserRole.servant, UserRole.member};

  List<_NavItem> _items(AppLocalizations l10n) => [
        _NavItem(l10n.home, Icons.home_outlined, '/home', _allRoles),
        _NavItem(l10n.youthMembers, Icons.groups_outlined, '/youth', {UserRole.admin, UserRole.servant}),
        _NavItem(l10n.attendance, Icons.fact_check_outlined, '/attendance', {UserRole.admin, UserRole.servant}),
        _NavItem(l10n.followUp, Icons.support_agent_outlined, '/followup', {UserRole.admin, UserRole.servant}),
        _NavItem(l10n.sermons, Icons.play_circle_outline, '/sermons', _allRoles),
        _NavItem(l10n.devotionals, Icons.menu_book_outlined, '/devotionals', _allRoles),
        _NavItem(l10n.quizzes, Icons.quiz_outlined, '/quizzes', _allRoles),
        _NavItem(l10n.leaderboard, Icons.leaderboard_outlined, '/leaderboard', _allRoles),
        _NavItem(l10n.activities, Icons.hiking_outlined, '/activities', _allRoles),
        _NavItem(l10n.news, Icons.newspaper_outlined, '/news', _allRoles),
        _NavItem(l10n.library, Icons.local_library_outlined, '/library', _allRoles),
        _NavItem(l10n.reports, Icons.bar_chart_outlined, '/reports', {UserRole.admin, UserRole.servant}),
        _NavItem(l10n.notifications, Icons.notifications_outlined, '/notifications', _allRoles),
      ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(currentUserProvider).valueOrNull;
    final role = user?.role ?? UserRole.member;
    final location = GoRouterState.of(context).matchedLocation;
    final items = _items(l10n).where((i) => i.visibleTo.contains(role)).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appTitle),
        actions: [
          if (role == UserRole.admin || role == UserRole.servant)
            IconButton(
              icon: const Icon(Icons.send_outlined),
              tooltip: l10n.notifications,
              onPressed: () => context.push('/send-notification'),
            ),
          if (role == UserRole.member)
            IconButton(
              icon: const Icon(Icons.qr_code_scanner),
              tooltip: l10n.scanQrCode,
              onPressed: () => context.push('/qr-checkin'),
            ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            children: [
              DrawerHeader(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(user?.fullName ?? '', style: Theme.of(context).textTheme.titleMedium),
                    Text(role.name, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              for (final item in items)
                ListTile(
                  leading: Icon(item.icon),
                  title: Text(item.label),
                  selected: location == item.route,
                  onTap: () {
                    Navigator.of(context).pop();
                    context.go(item.route);
                  },
                ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.logout),
                title: Text(l10n.logout),
                onTap: () => ref.read(authControllerProvider.notifier).signOut(),
              ),
            ],
          ),
        ),
      ),
      body: child,
    );
  }
}
