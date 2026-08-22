import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';
import 'package:st_paul_family/features/devotionals/data/devotional_repository.dart';
import 'package:st_paul_family/features/devotionals/domain/devotional.dart';

final devotionalRepositoryProvider = Provider<DevotionalRepository>((ref) => DevotionalRepository());

final devotionalsProvider = StreamProvider<List<Devotional>>((ref) => ref.watch(devotionalRepositoryProvider).watchAll());

final favoriteDevotionalIdsProvider = StreamProvider<Set<String>>((ref) {
  final uid = ref.watch(currentUserProvider).valueOrNull?.uid;
  if (uid == null) return Stream.value(<String>{});
  return ref.watch(devotionalRepositoryProvider).watchFavoriteIds(uid);
});

class DevotionalsScreen extends ConsumerWidget {
  const DevotionalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devotionalsAsync = ref.watch(devotionalsProvider);
    final favoritesAsync = ref.watch(favoriteDevotionalIdsProvider);
    final uid = ref.watch(currentUserProvider).valueOrNull?.uid;

    return AsyncValueWidget(
      value: devotionalsAsync,
      data: (devotionals) {
        if (devotionals.isEmpty) return const Center(child: Text('No devotionals yet.'));
        final favorites = favoritesAsync.valueOrNull ?? {};

        return ListView.builder(
          itemCount: devotionals.length,
          itemBuilder: (context, index) {
            final devotional = devotionals[index];
            final isFavorite = favorites.contains(devotional.id);

            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(devotional.title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(devotional.date.toString().split(' ').first, style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 8),
                    Text(devotional.body, maxLines: 4, overflow: TextOverflow.ellipsis),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        IconButton(
                          icon: Icon(isFavorite ? Icons.favorite : Icons.favorite_border),
                          onPressed: uid == null
                              ? null
                              : () => ref
                                  .read(devotionalRepositoryProvider)
                                  .toggleFavorite(uid, devotional.id, !isFavorite),
                        ),
                        IconButton(
                          icon: const Icon(Icons.share_outlined),
                          onPressed: () => SharePlus.instance.share(
                            ShareParams(text: '${devotional.title}\n\n${devotional.body}'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
