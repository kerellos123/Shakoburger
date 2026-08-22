import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/auth/domain/app_user.dart';
import 'package:st_paul_family/features/youth/presentation/youth_providers.dart';

/// Admin-only "add youth member" form. Creates the Auth account (with a
/// temporary password the member resets on first login) and the Firestore
/// profile in one step, then lets the admin assign a servant.
class YouthFormScreen extends ConsumerStatefulWidget {
  const YouthFormScreen({super.key});

  @override
  ConsumerState<YouthFormScreen> createState() => _YouthFormScreenState();
}

class _YouthFormScreenState extends ConsumerState<YouthFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _schoolController = TextEditingController();
  DateTime? _dateOfBirth;
  String? _assignedServantId;
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    final servantsAsync = ref.watch(servantsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Add Youth Member')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full name'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Phone'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _schoolController,
                decoration: const InputDecoration(labelText: 'School/University'),
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(_dateOfBirth == null ? 'Date of birth' : _dateOfBirth!.toString().split(' ').first),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime(DateTime.now().year - 18),
                    firstDate: DateTime(1970),
                    lastDate: DateTime.now(),
                  );
                  if (picked != null) setState(() => _dateOfBirth = picked);
                },
              ),
              const SizedBox(height: 12),
              AsyncValueWidget(
                value: servantsAsync,
                data: (servants) => DropdownButtonFormField<String>(
                  value: _assignedServantId,
                  decoration: const InputDecoration(labelText: 'Assigned servant'),
                  items: servants
                      .map((s) => DropdownMenuItem(value: s.uid, child: Text(s.fullName)))
                      .toList(),
                  onChanged: (v) => setState(() => _assignedServantId = v),
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    try {
      // NOTE: creating a secondary Auth user from a client app signs the admin
      // out of their own session on some platforms. In production, prefer
      // doing this via the admin dashboard's Cloud Function (Admin SDK), which
      // creates users without affecting the caller's session. This client-side
      // path is kept as a working fallback for mobile-only deployments.
      final secondaryAuth = fb.FirebaseAuth.instance;
      final tempPassword = 'Welcome${DateTime.now().millisecondsSinceEpoch}';
      final credential = await secondaryAuth.createUserWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: tempPassword,
      );
      final uid = credential.user!.uid;

      final member = AppUser(
        uid: uid,
        role: UserRole.member,
        fullName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        email: _emailController.text.trim(),
        dateOfBirth: _dateOfBirth,
        school: _schoolController.text.trim().isEmpty ? null : _schoolController.text.trim(),
        assignedServantId: _assignedServantId,
      );

      await FirebaseFirestore.instance.collection(FirestorePaths.users).doc(uid).set({
        ...member.toMap(),
        'createdAt': FieldValue.serverTimestamp(),
      });

      await secondaryAuth.sendPasswordResetEmail(email: _emailController.text.trim());

      if (mounted) context.pop();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
