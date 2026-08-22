import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/sermons/data/sermon_repository.dart';
import 'package:st_paul_family/features/sermons/domain/sermon.dart';
import 'package:url_launcher/url_launcher.dart';

final sermonRepositoryProvider = Provider<SermonRepository>((ref) => SermonRepository());

final sermonsProvider = StreamProvider<List<Sermon>>((ref) => ref.watch(sermonRepositoryProvider).watchAll());

class SermonsScreen extends ConsumerWidget {
  const SermonsScreen({super.key});

  IconData _iconFor(SermonMediaType type) => switch (type) {
        SermonMediaType.video => Icons.videocam_outlined,
        SermonMediaType.audio => Icons.headphones_outlined,
        SermonMediaType.pdf => Icons.picture_as_pdf_outlined,
        SermonMediaType.youtube => Icons.smart_display_outlined,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sermonsAsync = ref.watch(sermonsProvider);

    return AsyncValueWidget(
      value: sermonsAsync,
      data: (sermons) {
        if (sermons.isEmpty) return const Center(child: Text('No sermons yet.'));

        return ListView.builder(
          itemCount: sermons.length,
          itemBuilder: (context, index) {
            final sermon = sermons[index];
            return ListTile(
              leading: CircleAvatar(child: Icon(_iconFor(sermon.mediaType))),
              title: Text(sermon.title),
              subtitle: Text('${sermon.speaker} • ${sermon.topic}'),
              trailing: Text(sermon.date.toString().split(' ').first),
              onTap: () => launchUrl(Uri.parse(sermon.mediaUrl), mode: LaunchMode.externalApplication),
            );
          },
        );
      },
    );
  }
}
