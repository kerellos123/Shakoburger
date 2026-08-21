import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum UserRole { admin, servant, member }

UserRole userRoleFromString(String value) => UserRole.values.firstWhere(
      (r) => r.name == value,
      orElse: () => UserRole.member,
    );

class FamilyInfo extends Equatable {
  final String? fatherName;
  final String? motherName;
  final String? siblings;
  final String? familyPhone;

  const FamilyInfo({this.fatherName, this.motherName, this.siblings, this.familyPhone});

  factory FamilyInfo.fromMap(Map<String, dynamic>? map) => FamilyInfo(
        fatherName: map?['fatherName'],
        motherName: map?['motherName'],
        siblings: map?['siblings'],
        familyPhone: map?['familyPhone'],
      );

  Map<String, dynamic> toMap() => {
        'fatherName': fatherName,
        'motherName': motherName,
        'siblings': siblings,
        'familyPhone': familyPhone,
      };

  @override
  List<Object?> get props => [fatherName, motherName, siblings, familyPhone];
}

class EmergencyContact extends Equatable {
  final String? name;
  final String? phone;
  final String? relation;

  const EmergencyContact({this.name, this.phone, this.relation});

  factory EmergencyContact.fromMap(Map<String, dynamic>? map) => EmergencyContact(
        name: map?['name'],
        phone: map?['phone'],
        relation: map?['relation'],
      );

  Map<String, dynamic> toMap() => {'name': name, 'phone': phone, 'relation': relation};

  @override
  List<Object?> get props => [name, phone, relation];
}

/// Mirrors a `users/{uid}` Firestore document. See docs/DATABASE_SCHEMA.md.
class AppUser extends Equatable {
  final String uid;
  final UserRole role;
  final String fullName;
  final String? photoUrl;
  final String phone;
  final String email;
  final DateTime? dateOfBirth;
  final String? school;
  final String? job;
  final String? address;
  final String? church;
  final String? assignedServantId;
  final List<String> talents;
  final String? notes;
  final FamilyInfo familyInfo;
  final EmergencyContact emergencyContact;
  final String? spiritualStatus;
  final List<String> fcmTokens;
  final String locale;

  const AppUser({
    required this.uid,
    required this.role,
    required this.fullName,
    this.photoUrl,
    required this.phone,
    required this.email,
    this.dateOfBirth,
    this.school,
    this.job,
    this.address,
    this.church,
    this.assignedServantId,
    this.talents = const [],
    this.notes,
    this.familyInfo = const FamilyInfo(),
    this.emergencyContact = const EmergencyContact(),
    this.spiritualStatus,
    this.fcmTokens = const [],
    this.locale = 'ar',
  });

  factory AppUser.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return AppUser(
      uid: doc.id,
      role: userRoleFromString(data['role'] ?? 'member'),
      fullName: data['fullName'] ?? '',
      photoUrl: data['photoUrl'],
      phone: data['phone'] ?? '',
      email: data['email'] ?? '',
      dateOfBirth: (data['dateOfBirth'] as Timestamp?)?.toDate(),
      school: data['school'],
      job: data['job'],
      address: data['address'],
      church: data['church'],
      assignedServantId: data['assignedServantId'],
      talents: List<String>.from(data['talents'] ?? const []),
      notes: data['notes'],
      familyInfo: FamilyInfo.fromMap(data['familyInfo']),
      emergencyContact: EmergencyContact.fromMap(data['emergencyContact']),
      spiritualStatus: data['spiritualStatus'],
      fcmTokens: List<String>.from(data['fcmTokens'] ?? const []),
      locale: data['locale'] ?? 'ar',
    );
  }

  Map<String, dynamic> toMap() => {
        'role': role.name,
        'fullName': fullName,
        'photoUrl': photoUrl,
        'phone': phone,
        'email': email,
        'dateOfBirth': dateOfBirth != null ? Timestamp.fromDate(dateOfBirth!) : null,
        'school': school,
        'job': job,
        'address': address,
        'church': church,
        'assignedServantId': assignedServantId,
        'talents': talents,
        'notes': notes,
        'familyInfo': familyInfo.toMap(),
        'emergencyContact': emergencyContact.toMap(),
        'spiritualStatus': spiritualStatus,
        'locale': locale,
        'updatedAt': FieldValue.serverTimestamp(),
      };

  @override
  List<Object?> get props => [uid, role, fullName, email, assignedServantId];
}
