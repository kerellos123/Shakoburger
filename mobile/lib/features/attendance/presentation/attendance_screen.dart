import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/attendance/domain/meeting.dart';
import 'package:st_paul_family/features/attendance/presentation/attendance_providers.dart';
import 'package:st_paul_family/features/attendance/presentation/mark_attendance_screen.dart';

/// Servant/admin entry point: pick a meeting, then mark attendance for the
/// roster (manually) or project the meeting's QR code for self check-in.
class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meetingsAsync = ref.watch(allMeetingsProvider);

    return AsyncValueWidget(
      value: meetingsAsync,
      data: (meetings) {
        if (meetings.isEmpty) return const Center(child: Text('No meetings yet.'));

        return ListView.builder(
          itemCount: meetings.length,
          itemBuilder: (context, index) {
            final meeting = meetings[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: ListTile(
                title: Text(meeting.title),
                subtitle: Text('${meeting.type.name} • ${meeting.startAt.toString().split('.').first}'),
                trailing: IconButton(
                  icon: const Icon(Icons.qr_code_2),
                  tooltip: 'Show QR code',
                  onPressed: () => _showQrDialog(context, meeting),
                ),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => MarkAttendanceScreen(meeting: meeting)),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showQrDialog(BuildContext context, Meeting meeting) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(meeting.title),
        content: SizedBox(
          width: 240,
          height: 240,
          child: QrImageView(data: meeting.qrCode, size: 240),
        ),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
      ),
    );
  }
}
