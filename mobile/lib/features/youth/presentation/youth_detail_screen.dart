import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/attendance/presentation/attendance_history_list.dart';
import 'package:st_paul_family/features/followup/presentation/followup_providers.dart';
import 'package:st_paul_family/features/youth/presentation/youth_providers.dart';
import 'package:url_launcher/url_launcher.dart';

class YouthDetailScreen extends ConsumerWidget {
  const YouthDetailScreen({required this.memberId, super.key});

  final String memberId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memberAsync = ref.watch(memberProvider(memberId));
    final followUpAsync = ref.watch(followUpProvider(memberId));

    return Scaffold(
      appBar: AppBar(title: const Text('Member Profile')),
      body: AsyncValueWidget(
        value: memberAsync,
        data: (member) {
          if (member == null) return const Center(child: Text('Member not found'));

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Center(
                child: CircleAvatar(
                  radius: 48,
                  backgroundImage: member.photoUrl != null ? NetworkImage(member.photoUrl!) : null,
                  child: member.photoUrl == null ? Text(member.fullName.isNotEmpty ? member.fullName[0] : '?') : null,
                ),
              ),
              const SizedBox(height: 12),
              Center(child: Text(member.fullName, style: Theme.of(context).textTheme.titleLarge)),
              const SizedBox(height: 24),
              _InfoTile(icon: Icons.phone, label: 'Phone', value: member.phone, onTap: () => launchUrl(Uri.parse('tel:${member.phone}'))),
              _InfoTile(icon: Icons.cake_outlined, label: 'Date of birth', value: member.dateOfBirth?.toString().split(' ').first ?? '-'),
              _InfoTile(icon: Icons.school_outlined, label: 'School/University', value: member.school ?? '-'),
              _InfoTile(icon: Icons.work_outline, label: 'Job', value: member.job ?? '-'),
              _InfoTile(icon: Icons.home_outlined, label: 'Address', value: member.address ?? '-'),
              _InfoTile(icon: Icons.church_outlined, label: 'Church', value: member.church ?? '-'),
              _InfoTile(icon: Icons.star_outline, label: 'Talents', value: member.talents.isEmpty ? '-' : member.talents.join(', ')),
              _InfoTile(
                icon: Icons.family_restroom,
                label: 'Family',
                value: [member.familyInfo.fatherName, member.familyInfo.motherName].where((e) => e != null).join(' / ').ifEmpty('-'),
              ),
              _InfoTile(
                icon: Icons.emergency_outlined,
                label: 'Emergency contact',
                value: member.emergencyContact.name != null
                    ? '${member.emergencyContact.name} (${member.emergencyContact.phone ?? '-'})'
                    : '-',
              ),
              if (member.notes != null) _InfoTile(icon: Icons.note_outlined, label: 'Notes', value: member.notes!),
              const Divider(height: 32),
              Text('Follow-up', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              AsyncValueWidget(
                value: followUpAsync,
                data: (followUp) => followUp == null
                    ? const Text('No follow-up record yet.')
                    : Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Consecutive absences: ${followUp.consecutiveAbsences}'),
                              Text('Last attendance: ${followUp.lastAttendanceAt?.toString().split(' ').first ?? '-'}'),
                              Text('Spiritual status: ${followUp.spiritualStatus ?? '-'}'),
                            ],
                          ),
                        ),
                      ),
              ),
              const Divider(height: 32),
              Text('Attendance history', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              AttendanceHistoryList(memberId: memberId),
            ],
          );
        },
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.icon, required this.label, required this.value, this.onTap});

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      subtitle: Text(value),
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
    );
  }
}

extension on String {
  String ifEmpty(String fallback) => isEmpty ? fallback : this;
}
