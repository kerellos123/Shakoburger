import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/library/data/library_repository.dart';
import 'package:st_paul_family/features/library/domain/library_item.dart';
import 'package:url_launcher/url_launcher.dart';

final libraryRepositoryProvider = Provider<LibraryRepository>((ref) => LibraryRepository());

final libraryItemsProvider = StreamProvider.family<List<LibraryItem>, LibraryCategory?>((ref, category) {
  return ref.watch(libraryRepositoryProvider).watchByCategory(category);
});

class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> {
  LibraryCategory? _selected;

  @override
  Widget build(BuildContext context) {
    final itemsAsync = ref.watch(libraryItemsProvider(_selected));

    return Column(
      children: [
        SizedBox(
          height: 48,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: const Text('All'),
                  selected: _selected == null,
                  onSelected: (_) => setState(() => _selected = null),
                ),
              ),
              for (final category in LibraryCategory.values)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: Text(category.name),
                    selected: _selected == category,
                    onSelected: (_) => setState(() => _selected = category),
                  ),
                ),
            ],
          ),
        ),
        Expanded(
          child: AsyncValueWidget(
            value: itemsAsync,
            data: (items) {
              if (items.isEmpty) return const Center(child: Text('No items in this category.'));

              return ListView.builder(
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  return ListTile(
                    leading: const Icon(Icons.menu_book_outlined),
                    title: Text(item.title),
                    subtitle: item.body != null ? Text(item.body!, maxLines: 2, overflow: TextOverflow.ellipsis) : null,
                    trailing: item.fileUrl != null ? const Icon(Icons.open_in_new) : null,
                    onTap: item.fileUrl != null ? () => launchUrl(Uri.parse(item.fileUrl!)) : null,
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
