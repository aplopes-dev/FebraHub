enum CreditEntryType { charge, payment, creditFromRefund }

class CustomerCreditAccount {
  const CustomerCreditAccount({
    required this.customerId,
    required this.balanceCents,
    required this.updatedAt,
  });

  final String customerId;
  final int balanceCents;
  final DateTime updatedAt;

  CustomerCreditAccount copyWith({int? balanceCents, DateTime? updatedAt}) {
    return CustomerCreditAccount(
      customerId: customerId,
      balanceCents: balanceCents ?? this.balanceCents,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'customerId': customerId,
    'balanceCents': balanceCents,
    'updatedAt': updatedAt.toIso8601String(),
  };

  static CustomerCreditAccount fromJson(Map<String, dynamic> json) {
    return CustomerCreditAccount(
      customerId: json['customerId']! as String,
      balanceCents: json['balanceCents']! as int,
      updatedAt: DateTime.parse(json['updatedAt']! as String),
    );
  }
}

class CreditLedgerEntry {
  const CreditLedgerEntry({
    required this.id,
    required this.customerId,
    required this.type,
    required this.amountCents,
    required this.createdAt,
    this.shiftId,
    this.note,
    this.refundId,
  });

  final String id;
  final String customerId;
  final CreditEntryType type;
  final int amountCents;
  final DateTime createdAt;
  final String? shiftId;
  final String? note;
  final String? refundId;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'customerId': customerId,
    'type': type.name,
    'amountCents': amountCents,
    'createdAt': createdAt.toIso8601String(),
    'shiftId': shiftId,
    'note': note,
    'refundId': refundId,
  };

  static CreditLedgerEntry fromJson(Map<String, dynamic> json) {
    return CreditLedgerEntry(
      id: json['id']! as String,
      customerId: json['customerId']! as String,
      type: CreditEntryType.values.byName(json['type']! as String),
      amountCents: json['amountCents']! as int,
      createdAt: DateTime.parse(json['createdAt']! as String),
      shiftId: json['shiftId'] as String?,
      note: json['note'] as String?,
      refundId: json['refundId'] as String?,
    );
  }
}

class CreditState {
  const CreditState({
    this.accounts = const <CustomerCreditAccount>[],
    this.entries = const <CreditLedgerEntry>[],
  });

  final List<CustomerCreditAccount> accounts;
  final List<CreditLedgerEntry> entries;

  CustomerCreditAccount? accountFor(String customerId) {
    for (final CustomerCreditAccount a in accounts) {
      if (a.customerId == customerId) {
        return a;
      }
    }
    return null;
  }

  List<CreditLedgerEntry> entriesFor(String customerId) {
    return entries
        .where((CreditLedgerEntry e) => e.customerId == customerId)
        .toList()
      ..sort(
        (CreditLedgerEntry a, CreditLedgerEntry b) =>
            b.createdAt.compareTo(a.createdAt),
      );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'accounts': accounts.map((CustomerCreditAccount e) => e.toJson()).toList(),
    'entries': entries.map((CreditLedgerEntry e) => e.toJson()).toList(),
  };

  static CreditState fromJson(Map<String, dynamic> json) {
    final List<dynamic> rawAccounts =
        (json['accounts'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> rawEntries =
        (json['entries'] as List<dynamic>?) ?? const <dynamic>[];
    return CreditState(
      accounts:
          rawAccounts
              .map(
                (dynamic e) => CustomerCreditAccount.fromJson(
                  Map<String, dynamic>.from(e as Map),
                ),
              )
              .toList(),
      entries:
          rawEntries
              .map(
                (dynamic e) => CreditLedgerEntry.fromJson(
                  Map<String, dynamic>.from(e as Map),
                ),
              )
              .toList(),
    );
  }
}
