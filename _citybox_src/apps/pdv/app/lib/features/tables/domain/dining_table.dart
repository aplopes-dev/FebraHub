import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

class DiningTable {
  const DiningTable({
    required this.id,
    required this.label,
    required this.sortOrder,
    this.accountId,
  });

  final String id;
  final String label;
  final int sortOrder;
  final String? accountId;

  DiningTableStatus statusFor(SalonAccountStatus? accountStatus) {
    if (accountId == null || accountStatus == null) {
      return DiningTableStatus.free;
    }
    return switch (accountStatus) {
      SalonAccountStatus.open => DiningTableStatus.occupied,
      SalonAccountStatus.closing => DiningTableStatus.closing,
      SalonAccountStatus.closed => DiningTableStatus.free,
    };
  }

  DiningTable copyWith({String? accountId, bool clearAccount = false}) {
    return DiningTable(
      id: id,
      label: label,
      sortOrder: sortOrder,
      accountId: clearAccount ? null : (accountId ?? this.accountId),
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'label': label,
    'sortOrder': sortOrder,
    'accountId': accountId,
  };

  static DiningTable fromJson(Map<String, dynamic> json) {
    return DiningTable(
      id: json['id']! as String,
      label: json['label']! as String,
      sortOrder: json['sortOrder']! as int,
      accountId: json['accountId'] as String?,
    );
  }
}
