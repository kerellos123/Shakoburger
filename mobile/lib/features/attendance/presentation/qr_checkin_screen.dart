import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:st_paul_family/features/attendance/domain/attendance_record.dart';
import 'package:st_paul_family/features/attendance/presentation/attendance_providers.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';

/// Lets a youth member scan a meeting's QR code to self check-in.
class QrCheckinScreen extends ConsumerStatefulWidget {
  const QrCheckinScreen({super.key});

  @override
  ConsumerState<QrCheckinScreen> createState() => _QrCheckinScreenState();
}

class _QrCheckinScreenState extends ConsumerState<QrCheckinScreen> {
  bool _handled = false;

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handled) return;
    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null) return;

    setState(() => _handled = true);

    final repo = ref.read(attendanceRepositoryProvider);
    final uid = ref.read(currentUserProvider).valueOrNull?.uid;
    final meeting = await repo.findMeetingByQrCode(code);

    if (!mounted) return;

    if (meeting == null || uid == null) {
      _showResult('Invalid or expired QR code.');
      return;
    }

    await repo.markAttendance(
      meetingId: meeting.id,
      memberId: uid,
      status: AttendanceStatus.present,
      recordedBy: uid,
      method: AttendanceMethod.qr,
    );

    _showResult('Checked in to "${meeting.title}"!');
  }

  void _showResult(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // dismiss dialog
              Navigator.pop(context); // leave scanner
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan QR Code')),
      body: MobileScanner(onDetect: _onDetect),
    );
  }
}

extension _FirstOrNull<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
