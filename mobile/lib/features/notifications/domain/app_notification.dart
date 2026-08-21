import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum NotificationTargetScope { all, group, servant, member }

class NotificationTarget extends Equatable {
  final NotificationTargetScope scope;
  final String? groupId;
  final String? servantId;
  final String? memberId;

  const NotificationTarget({required this.scope, this.groupId, this.servantId, this.memberId});

  factory NotificationTarget.all() => const NotificationTarget(scope: NotificationTargetScope.all);
  factory NotificationTarget.group(String groupId) =>
      NotificationTarget(scope: NotificationTargetScope.group, groupId: groupId);
  factory NotificationTarget.servant(String servantId) =>
      NotificationTarget(scope: NotificationTargetScope.servant, servantId: servantId);
  factory NotificationTarget.member(String memberId) =>
      NotificationTarget(scope: NotificationTargetScope.member, memberId: memberId);

  factory NotificationTarget.fromMap(Map<String, dynamic> map) => NotificationTarget(
        scope: NotificationTargetScope.values.firstWhere(
          (s) => s.name == map['scope'],
          orElse: () => NotificationTargetScope.all,
        ),
        groupId: map['groupId'],
        servantId: map['servantId'],
        memberId: map['memberId'],
      );

  Map<String, dynamic> toMap() => {
        'scope': scope.name,
        if (groupId != null) 'groupId': groupId,
        if (servantId != null) 'servantId': servantId,
        if (memberId != null) 'memberId': memberId,
      };

  @override
  List<Object?> get props => [scope, groupId, servantId, memberId];
}

class AppNotification extends Equatable {
  final String id;
  final String title;
  final String body;
  final String type;
  final NotificationTarget target;
  final String sentBy;
  final DateTime sentAt;
  final Map<String, dynamic>? data;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.target,
    required this.sentBy,
    required this.sentAt,
    this.data,
  });

  factory AppNotification.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data()!;
    return AppNotification(
      id: doc.id,
      title: d['title'] ?? '',
      body: d['body'] ?? '',
      type: d['type'] ?? 'general',
      target: NotificationTarget.fromMap(Map<String, dynamic>.from(d['target'] ?? {'scope': 'all'})),
      sentBy: d['sentBy'] ?? '',
      sentAt: (d['sentAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      data: d['data'] != null ? Map<String, dynamic>.from(d['data']) : null,
    );
  }

  @override
  List<Object?> get props => [id, title, body, sentAt];
}
