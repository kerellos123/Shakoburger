import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/attendance/domain/attendance_record.dart';
import 'package:st_paul_family/features/attendance/domain/meeting.dart';
import 'package:st_paul_family/features/attendance/presentation/attendance_providers.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';
import 'package:st_paul_family/features/youth/presentation/youth_providers.dart';

final _attendanceForMeetingProvider = StreamProvider.family((ref, String meetingId) {
  return ref.watch(attendanceRepositoryProvider).watchAttendanceForMeeting(meetingId);
});

class MarkAttendanceScreen extends ConsumerWidget {
  const MarkAttendanceScreen({required this.meeting, super.key});

  final Meeting meeting;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(visibleMembersProvider);
    final existingAsync = ref.watch(_attendanceForMeetingProvider(meeting.id));
    final recordedBy = ref.watch(currentUserProvider).valueOrNull?.uid ?? '';

    return Scaffold(
      appBar: AppBar(title: Text(meeting.title)),
      body: AsyncValueWidget(
        value: membersAsync,
        data: (members) {
          return AsyncValueWidget(
            value: existingAsync,
            data: (existingRecords) {
              final statusByMember = {for (final r in existingRecords) r.memberId: r.status};

              return ListView.builder(
                itemCount: members.length,
                itemBuilder: (context, index) {
                  final member = members[index];
                  final current = statusByMember[member.uid];

                  return ListTile(
                    title: Text(member.fullName),
                    subtitle: Wrap(
                      spacing: 4,
                      children: AttendanceStatus.values.map((status) {
                        final selected = current == status;
                        return ChoiceChip(
                          label: Text(status.name),
                          selected: selected,
                          onSelected: (_) => ref.read(attendanceRepositoryProvider).markAttendance(
                                meetingId: meeting.id,
                                memberId: member.uid,
                                status: status,
                                recordedBy: recordedBy,
                                method: AttendanceMethod.manual,
                              ),
                        );
                      }).toList(),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
