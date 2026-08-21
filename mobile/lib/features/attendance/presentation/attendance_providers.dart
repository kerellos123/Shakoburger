import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/features/attendance/data/attendance_repository.dart';
import 'package:st_paul_family/features/attendance/domain/meeting.dart';

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) => AttendanceRepository());

final upcomingMeetingsProvider = StreamProvider<List<Meeting>>((ref) {
  return ref.watch(attendanceRepositoryProvider).watchUpcomingMeetings();
});

final allMeetingsProvider = StreamProvider<List<Meeting>>((ref) {
  return ref.watch(attendanceRepositoryProvider).watchAllMeetings();
});
