import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

class CouvertState {
  const CouvertState({required this.unitCents, required this.covers});

  final int unitCents;
  final int covers;

  int get totalCents => unitCents * covers;

  Map<String, Object?> toJson() => <String, Object?>{
    'unitCents': unitCents,
    'covers': covers,
  };

  static CouvertState fromJson(Map<String, dynamic> json) {
    return CouvertState(
      unitCents: json['unitCents']! as int,
      covers: json['covers']! as int,
    );
  }
}

class SalonAccount {
  const SalonAccount({
    required this.id,
    required this.status,
    required this.openedAt,
    required this.origin,
    this.tableId,
    this.tabNumber,
    this.tabCard,
    this.closedAt,
    this.lines = const <CounterCartLine>[],
    this.couvert,
    this.serviceFeeEnabled = false,
    this.serviceFeePercentBps = 1000,
    this.saleAdjustment,
    this.customerId,
    this.deliveryOrderId,
  });

  final String id;
  final SalonAccountStatus status;
  final DateTime openedAt;
  final DateTime? closedAt;
  final String? tableId;
  final String? tabNumber;
  final String? tabCard;
  final List<CounterCartLine> lines;
  final CouvertState? couvert;
  final bool serviceFeeEnabled;
  final int serviceFeePercentBps;
  final SaleAdjustment? saleAdjustment;
  final String? customerId;
  final SalonOrigin origin;
  final String? deliveryOrderId;

  bool get isActive =>
      status == SalonAccountStatus.open || status == SalonAccountStatus.closing;

  SalonAccount copyWith({
    SalonAccountStatus? status,
    DateTime? closedAt,
    String? tableId,
    bool clearTable = false,
    String? tabNumber,
    String? tabCard,
    List<CounterCartLine>? lines,
    CouvertState? couvert,
    bool clearCouvert = false,
    bool? serviceFeeEnabled,
    int? serviceFeePercentBps,
    SaleAdjustment? saleAdjustment,
    bool clearSaleAdjustment = false,
    String? customerId,
    String? deliveryOrderId,
  }) {
    return SalonAccount(
      id: id,
      status: status ?? this.status,
      openedAt: openedAt,
      closedAt: closedAt ?? this.closedAt,
      tableId: clearTable ? null : (tableId ?? this.tableId),
      tabNumber: tabNumber ?? this.tabNumber,
      tabCard: tabCard ?? this.tabCard,
      lines: lines ?? this.lines,
      couvert: clearCouvert ? null : (couvert ?? this.couvert),
      serviceFeeEnabled: serviceFeeEnabled ?? this.serviceFeeEnabled,
      serviceFeePercentBps: serviceFeePercentBps ?? this.serviceFeePercentBps,
      saleAdjustment:
          clearSaleAdjustment ? null : (saleAdjustment ?? this.saleAdjustment),
      customerId: customerId ?? this.customerId,
      origin: origin,
      deliveryOrderId: deliveryOrderId ?? this.deliveryOrderId,
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'status': status.name,
    'openedAt': openedAt.toIso8601String(),
    'closedAt': closedAt?.toIso8601String(),
    'tableId': tableId,
    'tabNumber': tabNumber,
    'tabCard': tabCard,
    'lines': lines.map((CounterCartLine e) => e.toJson()).toList(),
    'couvert': couvert?.toJson(),
    'serviceFeeEnabled': serviceFeeEnabled,
    'serviceFeePercentBps': serviceFeePercentBps,
    'saleAdjustment': saleAdjustment?.toJson(),
    'customerId': customerId,
    'origin': origin.name,
    'deliveryOrderId': deliveryOrderId,
  };

  static SalonAccount fromJson(Map<String, dynamic> json) {
    final List<dynamic> rawLines =
        (json['lines'] as List<dynamic>?) ?? const <dynamic>[];
    return SalonAccount(
      id: json['id']! as String,
      status: SalonAccountStatus.values.byName(json['status']! as String),
      openedAt: DateTime.parse(json['openedAt']! as String),
      closedAt:
          json['closedAt'] == null
              ? null
              : DateTime.parse(json['closedAt']! as String),
      tableId: json['tableId'] as String?,
      tabNumber: json['tabNumber'] as String?,
      tabCard: json['tabCard'] as String?,
      lines:
          rawLines
              .map(
                (dynamic e) => CounterCartLine.fromJson(
                  Map<String, dynamic>.from(e as Map),
                ),
              )
              .toList(),
      couvert:
          json['couvert'] == null
              ? null
              : CouvertState.fromJson(
                Map<String, dynamic>.from(json['couvert']! as Map),
              ),
      serviceFeeEnabled: (json['serviceFeeEnabled'] as bool?) ?? false,
      serviceFeePercentBps: (json['serviceFeePercentBps'] as int?) ?? 1000,
      saleAdjustment:
          json['saleAdjustment'] == null
              ? null
              : SaleAdjustment.fromJson(
                Map<String, dynamic>.from(json['saleAdjustment']! as Map),
              ),
      customerId: json['customerId'] as String?,
      origin: SalonOrigin.values.byName(json['origin']! as String),
      deliveryOrderId: json['deliveryOrderId'] as String?,
    );
  }
}
