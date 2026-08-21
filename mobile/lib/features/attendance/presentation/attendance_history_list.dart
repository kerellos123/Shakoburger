import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/attendance/domain/attendance_record.dart';
import 'package:st_paul_family/features/attendance/presentation/attendance_providers.dart';

final memberAttendanceHistoryProvider = StreamProvider.family((ref, String memberId) {
  return ref.watch(attendanceRepositoryProvider).watchAttendanceHistoryForMember(memberId);
});

class AttendanceHistoryList extends ConsumerWidget {
  const AttendanceHistoryList({required this.memberId, super.key});

  final String memberId;

  Color _colorFor(BuildContext context, AttendanceStatus status) {
    final scheme = Theme.of(context).colorScheme;
    return switch (status) {
      AttendanceStatus.present => Colors.green,
      AttendanceStatus.late => Colors.orange,
      AttendanceStatus.excused => scheme.tertiary,
      AttendanceStatus.absent => scheme.error,
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(memberAttendanceHistoryProvider(memberId));

    return AsyncValueWidget(
      value: historyAsync,
      data: (records) {
        if (records.isEmpty) return const Text('No attendance records yet.');

        return Column(
          children: records.take(20).map((r) {
            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                radius: 6,
                backgroundColor: _colorFor(context, r.status),
              ),
              title: Text(r.status.name),
              subtitle: Text(r.recordedAt.toString().split('.').first),
            );
          }).toList(),
        );
      },
    );
  }
}
