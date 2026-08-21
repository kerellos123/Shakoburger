import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:st_paul_family/core/localization/generated/app_localizations.dart';
import 'package:st_paul_family/features/attendance/presentation/attendance_providers.dart';
import 'package:st_paul_family/features/devotionals/data/devotional_repository.dart';
import 'package:st_paul_family/features/home/domain/verse_of_the_day.dart';
import 'package:st_paul_family/features/news/presentation/news_screen.dart';
import 'package:st_paul_family/features/sermons/presentation/sermons_screen.dart';

final _todayDevotionalProvider = StreamProvider((ref) => ref.watch(devotionalRepositoryProvider).watchToday());

/// The landing screen every role sees first: verse of the day, latest news
/// (doubling as announcements), upcoming meetings, recent sermons, and
/// today's devotional.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final verse = VerseOfTheDay.today();
    final newsAsync = ref.watch(newsProvider);
    final meetingsAsync = ref.watch(upcomingMeetingsProvider);
    final sermonsAsync = ref.watch(sermonsProvider);
    final devotionalAsync = ref.watch(_todayDevotionalProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          color: Theme.of(context).colorScheme.primaryContainer,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.verseOfTheDay, style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 8),
                Text('"${verse.$1}"', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text('— ${verse.$2}', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        _SectionHeader(title: l10n.dailyDevotional, onSeeAll: () => context.go('/devotionals')),
        devotionalAsync.when(
          data: (devotional) => devotional == null
              ? const Text('No devotional posted today yet.')
              : Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(devotional.title, style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(devotional.body, maxLines: 3, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                ),
          loading: () => const LinearProgressIndicator(),
          error: (_, __) => const SizedBox.shrink(),
        ),
        const SizedBox(height: 20),

        _SectionHeader(title: l10n.upcomingMeetings, onSeeAll: () => context.go('/attendance')),
        meetingsAsync.when(
          data: (meetings) => meetings.isEmpty
              ? const Text('No upcoming meetings.')
              : Column(
                  children: meetings.take(3).map((m) {
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.event_outlined),
                      title: Text(m.title),
                      subtitle: Text(m.startAt.toString().split('.').first),
                    );
                  }).toList(),
                ),
          loading: () => const LinearProgressIndicator(),
          error: (_, __) => const SizedBox.shrink(),
        ),
        const SizedBox(height: 20),

        _SectionHeader(title: l10n.recentSermons, onSeeAll: () => context.go('/sermons')),
        sermonsAsync.when(
          data: (sermons) => sermons.isEmpty
              ? const Text('No sermons yet.')
              : Column(
                  children: sermons.take(3).map((s) {
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.play_circle_outline),
                      title: Text(s.title),
                      subtitle: Text(s.speaker),
                    );
                  }).toList(),
                ),
          loading: () => const LinearProgressIndicator(),
          error: (_, __) => const SizedBox.shrink(),
        ),
        const SizedBox(height: 20),

        _SectionHeader(title: l10n.latestNews, onSeeAll: () => context.go('/news')),
        newsAsync.when(
          data: (news) => news.isEmpty
              ? const Text('No news yet.')
              : Column(
                  children: news.take(3).map((n) {
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.newspaper_outlined),
                      title: Text(n.title),
                      subtitle: Text(n.body, maxLines: 1, overflow: TextOverflow.ellipsis),
                    );
                  }).toList(),
                ),
          loading: () => const LinearProgressIndicator(),
          error: (_, __) => const SizedBox.shrink(),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onSeeAll});

  final String title;
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          TextButton(onPressed: onSeeAll, child: const Text('See all')),
        ],
      ),
    );
  }
}
