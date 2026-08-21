import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/auth/domain/app_user.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';
import 'package:st_paul_family/features/notifications/domain/app_notification.dart';
import 'package:st_paul_family/features/notifications/presentation/notification_providers.dart';
import 'package:st_paul_family/features/youth/presentation/youth_providers.dart';

const _notificationTypes = [
  'general',
  'meeting_reminder',
  'service',
  'conference',
  'trip',
  'sermon',
  'devotional',
];

/// Admin/servant screen for composing and sending a push notification to
/// everyone, a group, a specific servant, or an individual member.
class SendNotificationScreen extends ConsumerStatefulWidget {
  const SendNotificationScreen({super.key});

  @override
  ConsumerState<SendNotificationScreen> createState() => _SendNotificationScreenState();
}

class _SendNotificationScreenState extends ConsumerState<SendNotificationScreen> {
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  String _type = 'general';
  NotificationTargetScope _scope = NotificationTargetScope.all;
  String? _selectedMemberId;
  bool _sending = false;

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(currentUserProvider).valueOrNull?.role ?? UserRole.member;
    final membersAsync = ref.watch(visibleMembersProvider);

    final allowedScopes = role == UserRole.admin
        ? NotificationTargetScope.values
        : [NotificationTargetScope.member]; // servants can only message their own members

    return Scaffold(
      appBar: AppBar(title: const Text('Send Notification')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            TextField(controller: _titleController, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 12),
            TextField(
              controller: _bodyController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Message'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: _notificationTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (v) => setState(() => _type = v ?? 'general'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<NotificationTargetScope>(
              value: _scope,
              decoration: const InputDecoration(labelText: 'Send to'),
              items: allowedScopes
                  .map((s) => DropdownMenuItem(value: s, child: Text(s.name)))
                  .toList(),
              onChanged: (v) => setState(() => _scope = v ?? NotificationTargetScope.all),
            ),
            if (_scope == NotificationTargetScope.member) ...[
              const SizedBox(height: 12),
              AsyncValueWidget(
                value: membersAsync,
                data: (members) => DropdownButtonFormField<String>(
                  value: _selectedMemberId,
                  decoration: const InputDecoration(labelText: 'Member'),
                  items: members.map((m) => DropdownMenuItem(value: m.uid, child: Text(m.fullName))).toList(),
                  onChanged: (v) => setState(() => _selectedMemberId = v),
                ),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton.icon(
              icon: const Icon(Icons.send),
              label: _sending
                  ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Send'),
              onPressed: _sending ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (_titleController.text.trim().isEmpty || _bodyController.text.trim().isEmpty) return;

    final target = switch (_scope) {
      NotificationTargetScope.all => NotificationTarget.all(),
      NotificationTargetScope.group => NotificationTarget.all(), // group picker can be added once groups exist
      NotificationTargetScope.servant => NotificationTarget.servant(ref.read(currentUserProvider).valueOrNull!.uid),
      NotificationTargetScope.member => _selectedMemberId == null ? null : NotificationTarget.member(_selectedMemberId!),
    };

    if (target == null) return;

    setState(() => _sending = true);
    try {
      await ref.read(notificationRepositoryProvider).send(
            title: _titleController.text.trim(),
            body: _bodyController.text.trim(),
            target: target,
            type: _type,
          );
      if (mounted) Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}
