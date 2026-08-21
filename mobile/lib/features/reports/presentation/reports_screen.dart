import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/features/attendance/presentation/attendance_providers.dart';

/// Reads the `reportsCache/{yyyy-mm}` doc maintained nightly by the
/// `rebuildMonthlyReport` Cloud Function (see docs/DATABASE_SCHEMA.md) rather
/// than aggregating attendance client-side, which would be slow at scale.
class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  late DateTime _month = DateTime.now();
  Map<String, dynamic>? _report;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final period = '${_month.year}-${_month.month.toString().padLeft(2, '0')}';
    final report = await ref.read(attendanceRepositoryProvider).fetchMonthlyReport(period);
    setState(() {
      _report = report;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final report = _report;
    if (report == null) {
      return const Center(child: Text('No report generated for this month yet.'));
    }

    final byMember = Map<String, dynamic>.from(report['byMember'] ?? {});
    final avgAttendance = (report['avgAttendancePercent'] as num?)?.toDouble() ?? 0;
    final totalMeetings = report['totalMeetings'] ?? 0;

    final sortedMembers = byMember.entries.toList()
      ..sort((a, b) {
        final aPresent = (a.value['present'] ?? 0) as int;
        final bPresent = (b.value['present'] ?? 0) as int;
        return bPresent.compareTo(aPresent);
      });

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left),
              onPressed: () {
                setState(() => _month = DateTime(_month.year, _month.month - 1));
                _load();
              },
            ),
            Expanded(
              child: Text(
                '${_month.year}-${_month.month.toString().padLeft(2, '0')}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            IconButton(
              icon: const Icon(Icons.chevron_right),
              onPressed: () {
                setState(() => _month = DateTime(_month.year, _month.month + 1));
                _load();
              },
            ),
          ],
        ),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Text('${avgAttendance.toStringAsFixed(1)}%', style: Theme.of(context).textTheme.displaySmall),
                const Text('Average attendance'),
                const SizedBox(height: 4),
                Text('$totalMeetings meetings this month'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (sortedMembers.isNotEmpty)
          SizedBox(
            height: 220,
            child: BarChart(
              BarChartData(
                barGroups: [
                  for (var i = 0; i < sortedMembers.length.clamp(0, 10); i++)
                    BarChartGroupData(x: i, barRods: [
                      BarChartRodData(toY: ((sortedMembers[i].value['present'] ?? 0) as int).toDouble()),
                    ]),
                ],
              ),
            ),
          ),
        const SizedBox(height: 16),
        Text('Most active members', style: Theme.of(context).textTheme.titleMedium),
        for (final entry in sortedMembers.take(10))
          ListTile(
            title: Text(entry.key),
            trailing: Text('${entry.value['present'] ?? 0} present'),
          ),
      ],
    );
  }
}
