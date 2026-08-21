import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:st_paul_family/core/localization/generated/app_localizations.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/youth/presentation/youth_providers.dart';

class YouthListScreen extends ConsumerStatefulWidget {
  const YouthListScreen({super.key});

  @override
  ConsumerState<YouthListScreen> createState() => _YouthListScreenState();
}

class _YouthListScreenState extends ConsumerState<YouthListScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final membersAsync = ref.watch(visibleMembersProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/youth/new'),
        child: const Icon(Icons.person_add_alt_1),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: l10n.search,
              ),
              onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
            ),
          ),
          Expanded(
            child: AsyncValueWidget(
              value: membersAsync,
              data: (members) {
                final filtered = _query.isEmpty
                    ? members
                    : members.where((m) => m.fullName.toLowerCase().contains(_query)).toList();

                if (filtered.isEmpty) {
                  return Center(child: Text(l10n.youthMembers));
                }

                return ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final member = filtered[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundImage: member.photoUrl != null ? NetworkImage(member.photoUrl!) : null,
                        child: member.photoUrl == null ? Text(member.fullName.isNotEmpty ? member.fullName[0] : '?') : null,
                      ),
                      title: Text(member.fullName),
                      subtitle: Text(member.phone),
                      trailing: member.spiritualStatus != null ? Chip(label: Text(member.spiritualStatus!)) : null,
                      onTap: () => context.push('/youth/${member.uid}'),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
