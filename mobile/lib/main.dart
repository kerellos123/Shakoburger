import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:st_paul_family/core/localization/generated/app_localizations.dart';
import 'package:st_paul_family/core/router/app_router.dart';
import 'package:st_paul_family/core/theme/app_theme.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';
import 'package:st_paul_family/features/notifications/services/push_notification_service.dart';
import 'package:st_paul_family/firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await Hive.initFlutter(); // local cache for offline support
  await PushNotificationService.initialize();

  runApp(const ProviderScope(child: StPaulFamilyApp()));
}

class StPaulFamilyApp extends ConsumerWidget {
  const StPaulFamilyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    ref.listen(authStateProvider, (previous, next) {
      final uid = next.valueOrNull;
      if (uid != null) {
        PushNotificationService.syncTokenForUser(uid, ref.read(authRepositoryProvider));
      }
    });

    return MaterialApp.router(
      title: 'St. Paul the Apostle Family',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: router,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('ar'), Locale('en')],
    );
  }
}
